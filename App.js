import React, { useEffect, useState } from 'react';
import { auth, firebaseReady } from './firebaseClient';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, onAuthStateChanged, signOut } from 'firebase/auth';
import { View, Text, StyleSheet, Pressable, StatusBar, ScrollView, TextInput } from 'react-native';

const pink = '#ff1688';
const gold = '#d9b45b';
const clips = [
  { user: '@dcvideos', title: 'Bienvenidos a DC VIDEOS', caption: 'Tu espacio para descubrir y compartir videos.', tag: '#DCVideos' },
  { user: '@creadores', title: 'Tu próximo video puede estar aquí', caption: 'Comparte tus momentos con la comunidad.', tag: '#MiVideo' },
  { user: '@dcmodas', title: 'Estilo, creatividad y tendencia', caption: 'Descubre contenido de la comunidad.', tag: '#Estilo' },
];
const tabs = ['Inicio', 'Explorar', '＋', 'Bandeja', 'Perfil'];

function Action({ label, icon, onPress }) {
  return <Pressable style={styles.action} onPress={onPress}><Text style={styles.actionIcon}>{icon}</Text><Text style={styles.actionText}>{label}</Text></Pressable>;
}
function AppButton({ title, onPress, outline }) {
  return <Pressable onPress={onPress} style={[styles.button, outline && styles.buttonOutline]}><Text style={[styles.buttonText, outline && {color:pink}]}>{title}</Text></Pressable>;
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
  useEffect(() => { if (!firebaseReady || !auth) return; return onAuthStateChanged(auth, user => setCurrentUser(user)); }, []);
  const submitAuth = async () => {
    const validEmail = authEmail.includes('@') && authEmail.includes('.');
    if (!validEmail || authPassword.length < 6 || (authMode === 'register' && authName.trim().length < 2)) { setNotice('Revisa los datos. La contraseña debe tener al menos 6 caracteres.'); return; }
    if (!firebaseReady || !auth) { setNotice('Falta configurar Firebase para activar las cuentas reales.'); return; }
    try { setAuthBusy(true); if (authMode === 'register') { const result = await createUserWithEmailAndPassword(auth, authEmail.trim(), authPassword); await updateProfile(result.user, { displayName: authName.trim() }); } else { await signInWithEmailAndPassword(auth, authEmail.trim(), authPassword); } setNotice('¡Listo! Ya ingresaste a DC VIDEOS.'); }
    catch (error) { const messages = { 'auth/email-already-in-use':'Ese correo ya tiene una cuenta.', 'auth/invalid-email':'El correo no es válido.', 'auth/weak-password':'Usa una contraseña más segura.', 'auth/invalid-credential':'Correo o contraseña incorrectos.', 'auth/network-request-failed':'Revisa tu conexión a internet.' }; setNotice(messages[error.code] || 'No se pudo completar. Intenta nuevamente.'); }
    finally { setAuthBusy(false); }
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

  const publish = <View style={styles.page}><Text style={styles.pageTitle}>Crear publicación</Text><Text style={styles.muted}>Comparte un momento con DC VIDEOS</Text><View style={styles.uploadBox}><Text style={styles.uploadIcon}>＋</Text><Text style={styles.cardTitle}>Subir un video</Text><Text style={styles.muted}>La selección de archivos se habilitará en la siguiente etapa.</Text></View><AppButton title="Continuar" onPress={()=>setNotice('La publicación real se habilitará al integrar la carga de videos.')}/>{notice ? <Text style={styles.notice}>{notice}</Text>:null}</View>;

  const inbox = <View style={styles.page}><Text style={styles.pageTitle}>Bandeja</Text><View style={styles.empty}><Text style={styles.emptyIcon}>✉</Text><Text style={styles.cardTitle}>Tus mensajes aparecerán aquí</Text><Text style={styles.muted}>Los mensajes y notificaciones requieren cuentas conectadas.</Text></View></View>;

  const profile = <ScrollView contentContainerStyle={styles.page}>
    <Text style={styles.pageTitle}>Mi perfil</Text>
    {currentUser ? <>
      <View style={styles.avatar}><Text style={styles.avatarText}>DC</Text></View>
      <Text style={styles.profileName}>{currentUser.displayName || 'Usuario DC VIDEOS'}</Text>
      <Text style={styles.muted}>{currentUser.email}</Text>
      <View style={styles.stats}><View><Text style={styles.statNum}>0</Text><Text style={styles.muted}>Siguiendo</Text></View><View><Text style={styles.statNum}>0</Text><Text style={styles.muted}>Seguidores</Text></View><View><Text style={styles.statNum}>0</Text><Text style={styles.muted}>Me gusta</Text></View></View>
      <AppButton title="Cerrar sesión" onPress={async()=>{try{await signOut(auth);setNotice('Sesión cerrada.');}catch(e){setNotice('No se pudo cerrar sesión.');}}} outline/>
    </> : <>
      <Text style={styles.muted}>Crea tu cuenta o inicia sesión con correo electrónico</Text>
      <View style={styles.avatar}><Text style={styles.avatarText}>DC</Text></View>
      {authMode === 'register' ? <TextInput value={authName} onChangeText={setAuthName} placeholder="Tu nombre de usuario" placeholderTextColor="#888" autoCapitalize="none" style={styles.authInput}/> : null}
      <TextInput value={authEmail} onChangeText={setAuthEmail} placeholder="Correo electrónico" placeholderTextColor="#888" keyboardType="email-address" autoCapitalize="none" style={styles.authInput}/>
      <TextInput value={authPassword} onChangeText={setAuthPassword} placeholder="Contraseña (mínimo 6 caracteres)" placeholderTextColor="#888" secureTextEntry style={styles.authInput}/>
      <AppButton title={authBusy ? 'Un momento…' : authMode === 'register' ? 'Crear mi cuenta' : 'Entrar'} onPress={submitAuth}/>
      <Pressable onPress={()=>{setAuthMode(authMode === 'register' ? 'login' : 'register');setNotice('');}} style={{marginTop:20}}>
        <Text style={styles.authSwitch}>{authMode === 'register' ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}</Text>
      </Pressable>
      {!firebaseReady ? <Text style={styles.authFoot}>La conexión segura de cuentas se activará al configurar Firebase.</Text> : null}
    </>}
    {notice ? <Text style={styles.notice}>{notice}</Text>:null}
  </ScrollView>;

  const live = <View style={styles.page}><Text style={styles.pageTitle}>Transmisiones LIVE</Text><View style={styles.livePanel}><View style={styles.liveBadge}><View style={styles.dot}/><Text style={styles.liveText}>EN DIRECTO</Text></View><Text style={styles.liveBig}>LIVE</Text><Text style={styles.cardTitle}>Conecta en tiempo real</Text><Text style={styles.muted}>Estamos preparando las transmisiones en vivo para DC VIDEOS.</Text></View><AppButton title="Próximamente" onPress={()=>setNotice('LIVE necesita integrar un servicio de transmisión antes de funcionar.')}/>{notice ? <Text style={styles.notice}>{notice}</Text>:null}</View>;

  const screens = {Inicio:feed, Explorar:explore, '＋':publish, Bandeja:inbox, Perfil:profile, LIVE:live};
  return <View style={styles.container}><StatusBar barStyle="light-content" backgroundColor="#090909"/>{header}<View style={styles.body}>{screens[tab]}</View><View style={styles.nav}>{tabs.map(t=><Pressable key={t} onPress={()=>{setTab(t);setNotice('');}} style={styles.navItem}><Text style={[styles.navText,tab===t&&styles.navSelected]}>{t==='＋'?'＋':t}</Text>{t==='＋' ? <Text style={styles.navSmall}>Publicar</Text>:null}</Pressable>)}</View></View>;
}
const styles=StyleSheet.create({
 container:{flex:1,backgroundColor:'#090909'},header:{height:62,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:'#292929'},logo:{fontSize:24,fontWeight:'900',color:'#fff',letterSpacing:1},pink:{color:pink},livePill:{flexDirection:'row',alignItems:'center',gap:6,borderWidth:1,borderColor:pink,borderRadius:20,paddingHorizontal:12,paddingVertical:6},dot:{width:7,height:7,borderRadius:4,backgroundColor:pink},liveText:{color:'#fff',fontWeight:'900',fontSize:11,letterSpacing:1},body:{flex:1},feed:{flex:1,padding:12},feedTop:{height:38,flexDirection:'row',justifyContent:'center',gap:24,alignItems:'center'},feedMode:{color:'#fff',fontSize:15,fontWeight:'900',borderBottomWidth:2,borderBottomColor:pink,paddingBottom:7},muted:{color:'#999',fontSize:13,textAlign:'center'},video:{flex:1,marginRight:52,borderRadius:18,backgroundColor:'#19131b',borderWidth:1,borderColor:'#392638',justifyContent:'center',alignItems:'center',overflow:'hidden'},play:{fontSize:76,color:pink},tap:{color:gold,fontSize:9,letterSpacing:1.5,marginTop:8},videoInfo:{position:'absolute',bottom:20,left:16,right:10},username:{color:pink,fontWeight:'900',fontSize:15,marginBottom:6},videoTitle:{color:'#fff',fontSize:18,fontWeight:'800',marginBottom:5},caption:{color:'#ddd',fontSize:13},tag:{color:gold,fontSize:12,marginTop:7},sideActions:{position:'absolute',right:0,bottom:34,width:54,alignItems:'center',gap:15},action:{alignItems:'center',width:54},actionIcon:{fontSize:28,color:gold},actionText:{fontSize:9,color:'#eee',marginTop:2},nav:{height:62,borderTopWidth:1,borderTopColor:'#292929',flexDirection:'row',justifyContent:'space-around',alignItems:'center'},navItem:{flex:1,alignItems:'center',justifyContent:'center'},navText:{color:'#aaa',fontSize:12,fontWeight:'700'},navSelected:{color:pink},navSmall:{color:'#aaa',fontSize:9,marginTop:1},page:{flex:1,padding:22},pageTitle:{color:'#fff',fontSize:25,fontWeight:'900',marginBottom:8},authInput:{marginTop:14,backgroundColor:'#1c1c1c',borderRadius:12,padding:15,color:'#fff',borderWidth:1,borderColor:'#333'},authSwitch:{color:pink,textAlign:'center',fontWeight:'800'},authFoot:{color:'#777',fontSize:11,textAlign:'center',marginTop:24,lineHeight:17},search:{marginTop:20,backgroundColor:'#1c1c1c',borderRadius:12,padding:14,color:'#fff',borderWidth:1,borderColor:'#333'},sectionTitle:{color:'#fff',fontWeight:'800',fontSize:17,marginTop:26,marginBottom:10},listRow:{paddingVertical:17,borderBottomWidth:1,borderBottomColor:'#292929',flexDirection:'row',justifyContent:'space-between'},rowText:{color:'#eee',fontSize:15},gold:{color:gold,fontSize:23},uploadBox:{marginTop:32,marginBottom:22,minHeight:210,borderWidth:1,borderStyle:'dashed',borderColor:'#654052',borderRadius:18,alignItems:'center',justifyContent:'center',padding:22,backgroundColor:'#171117'},uploadIcon:{fontSize:48,color:pink,marginBottom:8},cardTitle:{color:'#fff',fontSize:17,fontWeight:'800',textAlign:'center',marginVertical:8},button:{backgroundColor:pink,borderRadius:12,padding:15,alignItems:'center',marginTop:18},buttonOutline:{backgroundColor:'transparent',borderWidth:1,borderColor:pink},buttonText:{color:'#fff',fontWeight:'900'},empty:{flex:1,alignItems:'center',justifyContent:'center',padding:24},emptyIcon:{fontSize:48,color:gold},avatar:{width:88,height:88,borderRadius:44,backgroundColor:'#271b27',borderWidth:2,borderColor:gold,alignSelf:'center',alignItems:'center',justifyContent:'center',marginTop:24},avatarText:{color:gold,fontSize:26,fontWeight:'900'},profileName:{color:'#fff',fontSize:19,fontWeight:'800',textAlign:'center',marginTop:15,marginBottom:7},stats:{flexDirection:'row',justifyContent:'space-around',marginVertical:28},statNum:{color:'#fff',fontSize:20,fontWeight:'900',textAlign:'center'},livePanel:{marginTop:25,padding:25,backgroundColor:'#21131e',borderRadius:18,borderWidth:1,borderColor:'#63304c',alignItems:'center'},liveBadge:{flexDirection:'row',alignItems:'center',gap:7,backgroundColor:'#3a182c',paddingHorizontal:12,paddingVertical:7,borderRadius:20},liveBig:{fontSize:62,color:pink,fontWeight:'900',marginVertical:12},notice:{color:gold,fontSize:12,textAlign:'center',marginTop:14,lineHeight:18}
});
