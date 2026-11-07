import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar } from 'react-native';

const clips = [
  { user: '@dcvideos', title: 'Bienvenidos a DC VIDEOS ✨', caption: 'Tu espacio para descubrir y compartir videos.', symbol: '▶' },
  { user: '@creadores', title: 'Tu próximo video puede estar aquí', caption: 'Publica tus momentos y conecta con otros creadores.', symbol: '✦' },
  { user: '@dcvideos', title: 'Muy pronto, más contenido', caption: 'Esta es una versión de demostración de la aplicación.', symbol: 'DC' },
];

export default function App() {
  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState({});
  const clip = clips[index];
  const next = () => setIndex((index + 1) % clips.length);
  const previous = () => setIndex((index + clips.length - 1) % clips.length);
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}><Text style={styles.logo}>DC <Text style={styles.pink}>VIDEOS</Text></Text><Text style={styles.live}>PARA TODOS</Text></View>
      <Pressable style={styles.video} onPress={next} onLongPress={previous}>
        <Text style={styles.play}>{clip.symbol}</Text>
        <Text style={styles.tap}>TOCA PARA VER EL SIGUIENTE</Text>
        <View style={styles.details}><Text style={styles.username}>{clip.user}</Text><Text style={styles.title}>{clip.title}</Text><Text style={styles.caption}>{clip.caption}</Text></View>
      </Pressable>
      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={() => setLiked({ ...liked, [index]: !liked[index] })}><Text style={styles.actionIcon}>{liked[index] ? '♥' : '♡'}</Text><Text style={styles.actionText}>{liked[index] ? 'Te gusta' : 'Me gusta'}</Text></Pressable>
        <Pressable style={styles.action} onPress={next}><Text style={styles.actionIcon}>➜</Text><Text style={styles.actionText}>Siguiente</Text></Pressable>
        <Pressable style={styles.action} onPress={() => setIndex(0)}><Text style={styles.actionIcon}>⌂</Text><Text style={styles.actionText}>Inicio</Text></Pressable>
      </View>
      <View style={styles.nav}><Text style={styles.navActive}>Inicio</Text><Text style={styles.navItem}>Explorar</Text><Text style={styles.navItem}>＋ Publicar</Text><Text style={styles.navItem}>Perfil</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#090909'}, header:{height:66,paddingHorizontal:20,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:'#292929'}, logo:{fontSize:25,fontWeight:'900',color:'#fff',letterSpacing:1},pink:{color:'#ff1688'},live:{color:'#d9b45b',fontSize:11,fontWeight:'800',letterSpacing:2}, video:{flex:1,margin:12,borderRadius:18,backgroundColor:'#18131a',justifyContent:'center',alignItems:'center',overflow:'hidden',borderWidth:1,borderColor:'#3a2634'},play:{fontSize:92,color:'#ff1688',fontWeight:'900'},tap:{color:'#d9b45b',fontSize:10,letterSpacing:2,marginTop:8},details:{position:'absolute',bottom:24,left:18,right:18},username:{color:'#ff1688',fontWeight:'900',fontSize:16,marginBottom:7},title:{color:'#fff',fontSize:19,fontWeight:'800',marginBottom:5},caption:{color:'#ddd',fontSize:13},actions:{height:74,flexDirection:'row',justifyContent:'space-around',alignItems:'center'},action:{alignItems:'center',minWidth:75},actionIcon:{fontSize:25,color:'#d9b45b'},actionText:{color:'#eee',fontSize:11,marginTop:3},nav:{height:60,borderTopWidth:1,borderTopColor:'#292929',flexDirection:'row',justifyContent:'space-around',alignItems:'center'},navActive:{color:'#ff1688',fontWeight:'800'},navItem:{color:'#bbb',fontSize:12}
});
