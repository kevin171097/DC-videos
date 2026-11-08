import React, { useEffect, useState } from 'react';
import { auth, firebaseReady } from './firebaseClient';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, onAuthStateChanged, signOut } from 'firebase/auth';
import { View, Text, StyleSheet, Pressable, StatusBar, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabaseClient';

const pink = '#ff1688';
const gold = '#d9b45b';
const clips = [
  { user: '@dayxon', title: 'Bienvenidos a DAYXON', caption: 'Tu espacio para descubrir y compartir videos.', tag: '#DAYXON' },
  { user: '@creadores', title: 'Tu próximo video puede estar aquí', caption: 'Comparte tus momentos con la comunidad.', tag: '#MiVideo' },
  { user: '@dcmodas', title: 'Estilo, creatividad y tendencia', caption: 'Descubre contenido de la comunidad.', tag: '#Estilo' },
];
const tabs = ['Inicio', 'Explorar', '＋', 'Bandeja', 'Perfil'];

function Action({ label, icon, onPress }) {
  return <Pressable style={styles.action} onPress={onPress}><Text style={styles.actionIcon}>{icon}</Text><Text style={styles.actionText}>{label}</Text></Pressable>;
}
function AppButton({ title, onPress, outline, disabled }) {
  return <Pressable disabled={disabled} onPress={onPress} style={[styles.button, outline && styles.buttonOutline, disabled && {opacity:0.55}]}><Text style={[styles.buttonText, outline && {color:pink}]}>{title}</Text></Pressable>;
}
function withTimeout(promise, ms = 20000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Object.assign(new Error('La conexión tardó demasiado.'), { code: 'auth/timeout' })), ms);
    promise.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
  });
}
export default function App() {
  const [tab, setTab] = useState('Inicio');
  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState({});
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [authMode, setAuthMode] = useState('register');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState('');
  useEffect(() => { if (!firebaseReady || !auth) return; return onAuthStateChanged(auth, user => setCurrentUser(user)); }, []);
  const submitAuth = async () => {
    const validEmail = authEmail.includes('@') && authEmail.includes('.');
    if (!validEmail || authPassword.length < 6 || (authMode === 'register' && authName.trim().length < 2)) { setNotice('Revisa los datos. La contraseña debe tener al menos 6 caracteres.'); return; }
    if (!firebaseReady || !auth) { setNotice('Falta configurar Firebase para activar las cuentas reales.'); return; }
    try { setAuthBusy(true); if (authMode === 'register') { const result = await withTimeout(createUserWithEmailAndPassword(auth, authEmail.trim(), authPassword)); updateProfile(result.user, { displayName: authName.trim() }).catch(() => {}); } else { await withTimeout(signInWithEmailAndPassword(auth, authEmail.trim(), authPassword)); } setNotice('¡Listo! Ya ingresaste a DAYXON.'); }
    catch (error) { const messages = { 'auth/email-already-in-use':'Ese correo ya tiene una cuenta. Prueba iniciar sesión.', 'auth/invalid-email':'El correo no es válido.', 'auth/weak-password':'Usa una contraseña más segura.', 'auth/invalid-credential':'Correo o contraseña incorrectos.', 'auth/network-request-failed':'No hay conexión con Firebase. Revisa internet e inténtalo otra vez.', 'auth/timeout':'Firebase no respondió en 20 segundos. Revisa internet y la configuración de Authentication.' }; setNotice(messages[error.code] || `No se pudo crear la cuenta (${error.code || 'error desconocido'}).`); }
    finally { setAuthBusy(false); }
  };
  const uploadVideo = async () => {
    if (!currentUser) { setNotice('Inicia sesión para publicar un video.'); return; }
    try {
      setUploadBusy(true);
      setNotice('');
      // Usar el selector de archivos nativo de Android (SAF), sin pedir
      // permisos de galería ni depender del módulo Expo Image Picker.
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      // Android entrega a menudo URI content://; leer el archivo con Expo
      // FileSystem evita fetch() local, que provoca Network request failed.
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const fileData = decode(base64);
      const safeName = (asset.name || 'video.mp4').replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${currentUser.uid}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from('Videos').upload(path, fileData, {
        contentType: asset.mimeType || 'video/mp4',
        upsert: false,
      });
      if (error) throw error;
      setUploadedVideo(safeName);
      setNotice('¡Video subido! Ya está guardado en DAYXON.');
    } catch (error) {
      setNotice(error?.message || 'No se pudo subir el video. Revisa tu conexión e inténtalo otra vez.');
    } finally {
      setUploadBusy(false);
    }
  };
  const clip = clips[index];
  const next = () => setIndex((index + 1) % clips.length);
  const like = () => setLiked({...liked, [index]: !liked[index]});
  const header = <View style={styles.header}><Text style={styles.logo}>DC <Text style={styles.pink}>VIDEOS</Text></Text><Pressable onPress={()=>setTab('LIVE')} style={styles.livePill}><View style={styles.dot}/><Text style={styles.liveText}>LIVE</Text></Pressable></View>;

  const feed = <View style={styles.feed}>
    <View style={styles.feedTop}><Text style={styles.feedMode}>Para ti</Text><Text style={styles.muted}>Siguiendo</Text></View>
    <Pressable style={styles.video} onPress={next}>
      <Text style={styles.play}>▶</Text><Text style={styles.tap}>TOCA PARA VER EL SIGUIENTE</Text>
      <View style={styles.videoInfo}><Text style={styles.username}>{clip.user}</Text><Text style={styles.videoTitle}>{clip.title}</Text><Text style={styles.caption}>{clip.caption}</Text><Text style={styles.tag}>{clip.tag}</Text></View>
    </Pressable>
    <View style={styles.sideActions}>
      <Action icon={liked[index]?'♥':'♡'} label="Me gusta" onPress={like}/>
      <Action icon="◌" label="Comentar" onPress={()=>setNotice('Los comentarios se habilitarán al conectar las cuentas.')}/>
      <Action icon="➤" label="Compartir" onPress={()=>setNotice('Compartir estará disponible al publicar videos reales.')}/>
    </View>
    {notice ? <Text style={styles.notice}>{notice}</Text> : null}
  </View>;

  const explore = <ScrollView contentContainerStyle={styles.page}><Text style={styles.pageTitle}>Explorar</Text><Text style={styles.muted}>Encuentra videos y creadores</Text><TextInput value={query} onChangeText={setQuery} placeholder="Buscar videos o usuarios" placeholderTextColor="#888" style={styles.search}/><Text style={styles.sectionTitle}>Tendencias</Text>{['Para ti','Música','Humor','Moda y estilo','Deportes','Uruguay'].filter(x=>x.toLowerCase().includes(query.toLowerCase())).map(x=><Pressable key={x} style={styles.listRow} onPress={()=>setNotice('La búsqueda se conectará al contenido publicado.')}><Text style={styles.rowText}># {x}</Text><Text style={styles.gold}>›</Text></Pressable>)}</ScrollView>;

  const publish = <View style={styles.page}><Text style={styles.pageTitle}>Crear publicación</Text><Text style={styles.muted}>Comparte un momento con DAYXON</Text><View style={styles.uploadBox}><Text style={styles.uploadIcon}>＋</Text><Text style={styles.cardTitle}>Subir un video</Text><Text style={styles.muted}>{currentUser ? 'Elige un video guardado en tu celular.' : 'Inicia sesión para poder publicar.'}</Text>{uploadBusy ? <ActivityIndicator size="large" color={pink} style={{marginTop:18}}/> : null}</View><AppButton title={uploadBusy ? 'Subiendo video…' : 'Elegir video del celular'} onPress={uploadVideo} disabled={uploadBusy || !currentUser}/>{uploadedVideo ? <Text style={styles.muted}>Último video subido: {uploadedVideo}</Text> : null}{notice ? <Text style={styles.notice}>{notice}</Text>:null}</View>;

  const inbox = <View style={styles.page}><Text style={styles.pageTitle}>Bandeja</Text><View style={styles.empty}><Text style={styles.emptyIcon}>✉</Text><Text style={styles.cardTitle}>Tus mensajes aparecerán aquí</Text><Text style={styles.muted}>Los mensajes y notificaciones requieren cuentas conectadas.</Text></View></View>;

  const profile = <ScrollView contentContainerStyle={styles.page}>
    <Text style={styles.pageTitle}>Mi perfil</Text>
    {currentUser ? <>
      <View style={styles.avatar}><Text style={styles.avatarText}>DX</Text></View>
      <Text style={styles.profileName}>{currentUser.displayName || 'Usuario DAYXON'}</Text>
      <Text style={styles.muted}>{currentUser.email}</Text>
      <View style={styles.stats}><View><Text style={styles.statNum}>0</Text><Text style={styles.muted}>Siguiendo</Text></View><View><Text style={styles.statNum}>0</Text><Text style={styles.muted}>Seguidores</Text></View><View><Text style={styles.statNum}>0</Text><Text style={styles.muted}>Me gusta</Text></View></View>
      <AppButton title="Cerrar sesión" onPress={async()=>{try{await signOut(auth);setNotice('Sesión cerrada.');}catch(e){setNotice('No se pudo cerrar sesión.');}}} outline/>
    </> : <>
      <Text style={styles.muted}>Crea tu cuenta o inicia sesión con correo electrónico</Text>
      <View style={styles.avatar}><Text style={styles.avatarText}>DX</Text></View>
      {authMode === 'register' ? <TextInput value={authName} onChangeText={setAuthName} placeholder="Tu nombre de usuario" placeholderTextColor="#888" autoCapitalize="none" style={styles.authInput}/> : null}
      <TextInput value={authEmail} onChangeText={setAuthEmail} placeholder="Correo electrónico" placeholderTextColor="#888" keyboardType="email-address" autoCapitalize="none" style={styles.authInput}/>
      <TextInput value={authPassword} onChangeText={setAuthPassword} placeholder="Contraseña (mínimo 6 caracteres)" placeholderTextColor="#888" secureTextEntry style={styles.authInput}/>
      <AppButton title={authBusy ? 'Conectando…' : authMode === 'register' ? 'Crear mi cuenta' : 'Entrar'} onPress={submitAuth} disabled={authBusy}/>
      <Pressable onPress={()=>{setAuthMode(authMode === 'register' ? 'login' : 'register');setNotice('');}} style={{marginTop:20}}>
        <Text style={styles.authSwitch}>{authMode === 'register' ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}</Text>
      </Pressable>
      {!firebaseReady ? <Text style={styles.authFoot}>La conexión segura de cuentas se activará al configurar Firebase.</Text> : null}
    </>}
    {notice ? <Text style={styles.notice}>{notice}</Text>:null}
  </ScrollView>;

  const live = <View style={styles.page}><Text style={styles.pageTitle}>Transmisiones LIVE</Text><View style={styles.livePanel}><View style={styles.liveBadge}><View style={styles.dot}/><Text style={styles.liveText}>EN DIRECTO</Text></View><Text style={styles.liveBig}>LIVE</Text><Text style={styles.cardTitle}>Conecta en tiempo real</Text><Text style={styles.muted}>Estamos preparando las transmisiones en vivo para DAYXON.</Text></View><AppButton title="Próximamente" onPress={()=>setNotice('LIVE necesita integrar un servicio de transmisión antes de funcionar.')}/>{notice ? <Text style={styles.notice}>{notice}</Text>:null}</View>;

  const screens = {Inicio:feed, Explorar:explore, '＋':publish, Bandeja:inbox, Perfil:profile, LIVE:live};
  const navItems = [{tab:'Inicio',icon:'⌂',label:'Inicio'},{tab:'Explorar',icon:'⌕',label:'Explorar'},{tab:'＋',icon:'＋',label:'Publicar'},{tab:'Bandeja',icon:'▣',label:'Bandeja'},{tab:'Perfil',icon:'◉',label:'Perfil'}];
  return <View style={styles.container}><StatusBar barStyle="light-content" backgroundColor="#090909"/>{header}<View style={styles.body}>{screens[tab]}</View><View style={styles.nav}>{navItems.map(item=><Pressable key={item.tab} onPress={()=>{setTab(item.tab);setNotice('');}} style={styles.navItem}>{item.tab==='＋' ? <View style={styles.createNav}><Text style={styles.createNavText}>＋</Text></View> : <Text style={[styles.navIcon,tab===item.tab&&styles.navIconSelected]}>{item.icon}</Text>}<Text style={[styles.navLabel,tab===item.tab&&styles.navLabelSelected]}>{item.label}</Text></Pressable>)}</View></View>;
}
const styles=StyleSheet.create({
 container:{flex:1,backgroundColor:'#090909'},header:{height:62,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:'#292929'},logo:{fontSize:24,fontWeight:'900',color:'#fff',letterSpacing:1},pink:{color:pink},livePill:{flexDirection:'row',alignItems:'center',gap:6,borderWidth:1,borderColor:pink,borderRadius:20,paddingHorizontal:12,paddingVertical:6},dot:{width:7,height:7,borderRadius:4,backgroundColor:pink},liveText:{color:'#fff',fontWeight:'900',fontSize:11,letterSpacing:1},body:{flex:1},feed:{flex:1,padding:12},feedTop:{height:38,flexDirection:'row',justifyContent:'center',gap:24,alignItems:'center'},feedMode:{color:'#fff',fontSize:15,fontWeight:'900',borderBottomWidth:2,borderBottomColor:pink,paddingBottom:7},muted:{color:'#999',fontSize:13,textAlign:'center'},video:{flex:1,marginRight:52,borderRadius:18,backgroundColor:'#19131b',borderWidth:1,borderColor:'#392638',justifyContent:'center',alignItems:'center',overflow:'hidden'},play:{fontSize:76,color:pink},tap:{color:gold,fontSize:9,letterSpacing:1.5,marginTop:8},videoInfo:{position:'absolute',bottom:20,left:16,right:10},username:{color:pink,fontWeight:'900',fontSize:15,marginBottom:6},videoTitle:{color:'#fff',fontSize:18,fontWeight:'800',marginBottom:5},caption:{color:'#ddd',fontSize:13},tag:{color:gold,fontSize:12,marginTop:7},sideActions:{position:'absolute',right:0,bottom:34,width:54,alignItems:'center',gap:15},action:{alignItems:'center',width:54},actionIcon:{fontSize:28,color:gold},actionText:{fontSize:9,color:'#eee',marginTop:2},nav:{height:70,borderTopWidth:1,borderTopColor:'#292929',backgroundColor:'#090909',flexDirection:'row',justifyContent:'space-around',alignItems:'center',paddingBottom:5},navItem:{flex:1,alignItems:'center',justifyContent:'center',gap:3},navIcon:{color:'#aaa',fontSize:24,fontWeight:'700',height:27},navIconSelected:{color:'#fff'},navLabel:{color:'#aaa',fontSize:10,fontWeight:'600'},navLabelSelected:{color:'#fff',fontWeight:'900'},createNav:{width:44,height:29,backgroundColor:'#fff',borderRadius:8,alignItems:'center',justifyContent:'center',borderLeftWidth:4,borderLeftColor:'#25d9e8',borderRightWidth:4,borderRightColor:pink},createNavText:{color:'#090909',fontSize:25,fontWeight:'900',lineHeight:28},page:{flex:1,padding:22},pageTitle:{color:'#fff',fontSize:25,fontWeight:'900',marginBottom:8},authInput:{marginTop:14,backgroundColor:'#1c1c1c',borderRadius:12,padding:15,color:'#fff',borderWidth:1,borderColor:'#333'},authSwitch:{color:pink,textAlign:'center',fontWeight:'800'},authFoot:{color:'#777',fontSize:11,textAlign:'center',marginTop:24,lineHeight:17},search:{marginTop:20,backgroundColor:'#1c1c1c',borderRadius:12,padding:14,color:'#fff',borderWidth:1,borderColor:'#333'},sectionTitle:{color:'#fff',fontWeight:'800',fontSize:17,marginTop:26,marginBottom:10},listRow:{paddingVertical:17,borderBottomWidth:1,borderBottomColor:'#292929',flexDirection:'row',justifyContent:'space-between'},rowText:{color:'#eee',fontSize:15},gold:{color:gold,fontSize:23},uploadBox:{marginTop:32,marginBottom:22,minHeight:210,borderWidth:1,borderStyle:'dashed',borderColor:'#654052',borderRadius:18,alignItems:'center',justifyContent:'center',padding:22,backgroundColor:'#171117'},uploadIcon:{fontSize:48,color:pink,marginBottom:8},cardTitle:{color:'#fff',fontSize:17,fontWeight:'800',textAlign:'center',marginVertical:8},button:{backgroundColor:pink,borderRadius:12,padding:15,alignItems:'center',marginTop:18},buttonOutline:{backgroundColor:'transparent',borderWidth:1,borderColor:pink},buttonText:{color:'#fff',fontWeight:'900'},empty:{flex:1,alignItems:'center',justifyContent:'center',padding:24},emptyIcon:{fontSize:48,color:gold},avatar:{width:88,height:88,borderRadius:44,backgroundColor:'#271b27',borderWidth:2,borderColor:gold,alignSelf:'center',alignItems:'center',justifyContent:'center',marginTop:24},avatarText:{color:gold,fontSize:26,fontWeight:'900'},profileName:{color:'#fff',fontSize:19,fontWeight:'800',textAlign:'center',marginTop:15,marginBottom:7},stats:{flexDirection:'row',justifyContent:'space-around',marginVertical:28},statNum:{color:'#fff',fontSize:20,fontWeight:'900',textAlign:'center'},livePanel:{marginTop:25,padding:25,backgroundColor:'#21131e',borderRadius:18,borderWidth:1,borderColor:'#63304c',alignItems:'center'},liveBadge:{flexDirection:'row',alignItems:'center',gap:7,backgroundColor:'#3a182c',paddingHorizontal:12,paddingVertical:7,borderRadius:20},liveBig:{fontSize:62,color:pink,fontWeight:'900',marginVertical:12},notice:{color:gold,fontSize:12,textAlign:'center',marginTop:14,lineHeight:18}
});
