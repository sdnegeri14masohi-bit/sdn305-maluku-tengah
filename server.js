
require('dotenv').config();
const express=require('express');
const session=require('express-session');
const SQLiteStore=require('connect-sqlite3')(session);
const Database=require('better-sqlite3');
const bcrypt=require('bcryptjs');
const multer=require('multer');
const path=require('path'),fs=require('fs');
const helmet=require('helmet'),compression=require('compression');

const app=express();
const PORT=process.env.PORT||3000;
const DATA_DIR=process.env.DATA_DIR||path.join(__dirname,'data');
const UPLOAD_DIR=path.join(DATA_DIR,'uploads');
fs.mkdirSync(UPLOAD_DIR,{recursive:true});
const db=new Database(path.join(DATA_DIR,'school.db'));
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS items (type TEXT NOT NULL,id INTEGER PRIMARY KEY AUTOINCREMENT,data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL);
`);
const defaults={
school:{name:'SDN 305 Maluku Tengah',tag:'Berkarakter • Berprestasi • Berbudaya',desc:'Sekolah dasar di Kelurahan Namaelo, Kecamatan Kota Masohi, Kabupaten Maluku Tengah.',about:'Website resmi sekolah sebagai pusat informasi bagi siswa, orang tua, guru, alumni, dan masyarakat.',address:'Jl. Nuri, Kelurahan Namaelo, Kecamatan Kota Masohi, Kabupaten Maluku Tengah, Provinsi Maluku',contact:'Tambahkan nomor telepon dan email resmi sekolah.',email:'',social:'Facebook • Instagram • YouTube',hero:'Membangun generasi cerdas, berkarakter, berprestasi, dan berbudaya melalui pendidikan yang berkualitas.',photo:'',logo:''},
guru:[{id:1,name:'Nama Kepala Sekolah',role:'Kepala Sekolah',desc:'Tambahkan profil kepala sekolah.',photo:''},{id:2,name:'Nama Guru',role:'Guru Kelas / Mata Pelajaran',desc:'Tambahkan profil guru.',photo:''}],
siswa:[1,2,3,4,5,6].map((n)=>({id:n,kelas:'Kelas '+['I','II','III','IV','V','VI'][n-1],jumlah:'0',desc:''})),
berita:[{id:1,title:'Selamat Datang di Website SDN 305',text:'Website resmi sekolah hadir sebagai media informasi dan komunikasi.',photo:''}],
agenda:[{id:1,date:'12',month:'SEP',title:'Upacara Bendera',text:'Kegiatan rutin sekolah.'}],
pengumuman:[{id:1,text:'Pengumuman sekolah dapat ditampilkan di bagian ini.'}],
galeri:[{id:1,title:'Foto Utama',photo:''},{id:2,title:'Kegiatan Sekolah',photo:''}],
prestasi:[{id:1,title:'Prestasi Siswa',text:'Tambahkan prestasi akademik maupun non-akademik.'}],
kegiatan:[{id:1,title:'📚 Literasi',text:'Penguatan budaya membaca dan belajar.'},{id:2,title:'⚽ Olahraga',text:'Kegiatan olahraga sekolah.'},{id:3,title:'🎨 Seni & Budaya',text:'Pengembangan kreativitas dan budaya daerah.'}]
};
function init(){
 console.log(`Admin awal: ${user}`);
 if(!process.env.ADMIN_PASS) console.log(`Password admin awal (simpan baik-baik): ${pass}`);
if(!db.prepare('SELECT 1 FROM settings WHERE key=?').get('school'))db.prepare('INSERT INTO settings(key,value) VALUES(?,?)').run('school',JSON.stringify(defaults.school));
for(const type of Object.keys(defaults).filter(k=>k!=='school')){
 if(!db.prepare('SELECT 1 FROM items WHERE type=? LIMIT 1').get(type)){
   const st=db.prepare('INSERT INTO items(type,data) VALUES(?,?)');
   const setId=db.prepare('UPDATE items SET data=? WHERE id=?');
   for(const x of defaults[type]){
     const seed={...x};
     delete seed.id;
     const r=st.run(type,JSON.stringify(seed));
     const created={id:Number(r.lastInsertRowid),...seed};
     setId.run(JSON.stringify(created),r.lastInsertRowid);
   }
 }
}
if(!db.prepare('SELECT 1 FROM admins LIMIT 1').get()){
 const crypto = require('crypto');
 const user=process.env.ADMIN_USER||'admin';
 const pass=process.env.ADMIN_PASS || crypto.randomBytes(18).toString('base64url');
 db.prepare('INSERT INTO admins(username,password_hash) VALUES(?,?)').run(user,bcrypt.hashSync(pass,12));
 console.log(`Admin awal: ${user} / ${pass} (GANTI SEGERA)`);
}
}
init();
function getData(){
 const school=JSON.parse(db.prepare('SELECT value FROM settings WHERE key=?').get('school').value);
 const out={school};
 for(const type of Object.keys(defaults).filter(k=>k!=='school'))out[type]=db.prepare('SELECT data FROM items WHERE type=? ORDER BY id DESC').all(type).map(r=>JSON.parse(r.data));
 return out;
}
app.set('trust proxy',1);
app.use(helmet({crossOriginResourcePolicy:{policy:'cross-origin'}}));
app.use(compression());
app.use(express.json({limit:'1mb'}));
app.use(express.urlencoded({extended:true}));
app.use(session({
 secret:process.env.SESSION_SECRET||'change-this-session-secret',
 resave:false,saveUninitialized:false,
 store:new SQLiteStore({db:'sessions.db',dir:DATA_DIR}),
 cookie:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:8*60*60*1000}
}));
const requireAdmin=(req,res,next)=>req.session.admin?next():res.status(401).json({error:'Silakan login sebagai admin.'});
const storage=multer.diskStorage({destination:UPLOAD_DIR,filename:(req,file,cb)=>{
 const ext=path.extname(file.originalname).toLowerCase().replace(/[^.\w]/g,'');
 cb(null,Date.now()+'-'+Math.random().toString(36).slice(2)+ext);
}});
const upload=multer({storage,limits:{fileSize:5*1024*1024},fileFilter:(req,file,cb)=>/^image\/(jpeg|png|webp|gif|svg\+xml)$/.test(file.mimetype)?cb(null,true):cb(new Error('Hanya file gambar yang diizinkan.'))});

app.get('/api/data',(req,res)=>res.json({data:getData()}));
app.get('/api/me',(req,res)=>res.json({authenticated:!!req.session.admin,username:req.session.admin?.username||null}));
app.post('/api/login',(req,res)=>{
 const {username,password}=req.body||{}, row=db.prepare('SELECT * FROM admins WHERE username=?').get(username||'');
 if(!row||!bcrypt.compareSync(password||'',row.password_hash))return res.status(401).json({error:'Username atau password salah.'});
 req.session.admin={id:row.id,username:row.username};res.json({ok:true});
});
app.post('/api/logout',requireAdmin,(req,res)=>req.session.destroy(()=>res.json({ok:true})));
app.put('/api/school',requireAdmin,(req,res)=>{
 const current=getData().school, allowed=['name','tag','desc','about','address','contact','email','social','hero','photo','logo'];
 const next={...current};for(const k of allowed)if(req.body[k]!==undefined)next[k]=String(req.body[k]);
 db.prepare('UPDATE settings SET value=? WHERE key=?').run(JSON.stringify(next),'school');res.json({data:getData()});
});
app.post('/api/upload',requireAdmin,upload.single('file'),(req,res)=>{if(!req.file)return res.status(400).json({error:'File tidak ditemukan.'});res.json({url:'/uploads/'+req.file.filename})});
app.use('/uploads',express.static(UPLOAD_DIR,{maxAge:'30d'}));
const allowedTypes=new Set(Object.keys(defaults).filter(k=>k!=='school'));
app.post('/api/items/:type',requireAdmin,(req,res)=>{
 const type=req.params.type;if(!allowedTypes.has(type))return res.status(404).json({error:'Jenis data tidak dikenal.'});
 const x={...req.body};delete x.id;
 const r=db.prepare('INSERT INTO items(type,data) VALUES(?,?)').run(type,JSON.stringify(x));
 const created={id:Number(r.lastInsertRowid),...x};db.prepare('UPDATE items SET data=? WHERE id=?').run(JSON.stringify(created),r.lastInsertRowid);
 res.json({data:getData(),item:created});
});
app.put('/api/items/:type/:id',requireAdmin,(req,res)=>{
 const type=req.params.type,id=Number(req.params.id);if(!allowedTypes.has(type))return res.status(404).json({error:'Jenis data tidak dikenal.'});
 const row=db.prepare('SELECT data FROM items WHERE type=? AND id=?').get(type,id);if(!row)return res.status(404).json({error:'Data tidak ditemukan.'});
 const next={...JSON.parse(row.data),...req.body,id};db.prepare('UPDATE items SET data=? WHERE type=? AND id=?').run(JSON.stringify(next),type,id);res.json({data:getData()});
});
app.delete('/api/items/:type/:id',requireAdmin,(req,res)=>{
 const type=req.params.type,id=Number(req.params.id);if(!allowedTypes.has(type))return res.status(404).json({error:'Jenis data tidak dikenal.'});
 db.prepare('DELETE FROM items WHERE type=? AND id=?').run(type,id);res.json({data:getData()});
});
app.put('/api/account',requireAdmin,(req,res)=>{
 const {username,password}=req.body||{};if(!username||!password||password.length<8)return res.status(400).json({error:'Username wajib diisi dan password minimal 8 karakter.'});
 try{db.prepare('UPDATE admins SET username=?,password_hash=? WHERE id=?').run(username,bcrypt.hashSync(password,12),req.session.admin.id);req.session.admin.username=username;res.json({ok:true})}
 catch(e){res.status(400).json({error:'Username sudah digunakan atau tidak valid.'})}
});
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.use((err,req,res,next)=>{console.error(err);res.status(400).json({error:err.message||'Terjadi kesalahan.'})});
app.listen(PORT,()=>console.log(`SDN 305 website berjalan di port ${PORT}`));
