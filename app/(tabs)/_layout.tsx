import React from 'react';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
View,
Pressable,
StyleSheet,
useWindowDimensions,
} from 'react-native';
import { theme } from '../../src/lib/theme';

const items = [
{ icon: 'camera-outline' as const, route: '/(tabs)/create', name: 'Camera' },
{ icon: 'game-controller-outline' as const, route: '/games-hub', name: 'Games' },
{ icon: 'people-outline' as const, route: '/(tabs)/communities' name: 'Community' },
{ icon: 'menu-outline' as const, route: '/(tabs)/more', name: 'More' },
{ icon: 'home-outline' as const, route: '/(tabs)', name: 'Home' },
{ icon: 'chatbubble-ellipses-outline' as const, route: '/messages', name: 'Messages' },
{ icon: 'videocam-outline' as const, route: '/stories', name: 'Videos' },
];

function IconBar() {
const { width } = useWindowDimensions();

return (
<View style={styles.bar}>
{items.map((item) => (
<Pressable
key={item.name}
accessibilityRole="button"
accessibilityLabel={item.name}
onPress={() => router.push(item.route as never)}
style={[
styles.iconButton,
{ width: (width - 12) / 7 },
]}
hitSlop={4}
>
<Ionicons
name={item.icon}
size={24}
color={item.name === 'Home' ? theme.cyan : theme.muted}
/>
</Pressable>
))}
</View>
);
}

export default function TabLayout() {
return (
<Tabs
tabBar={() => <IconBar />}
screenOptions={{
headerShown: false,
sceneStyle: { backgroundColor: theme.bg },
}}
>
<Tabs.Screen name="index" />
<Tabs.Screen name="create" />

  {/* Keep these screens available without adding extra tab buttons. */}
  <Tabs.Screen name="discover" options={{ href: null }} />
  <Tabs.Screen name="offline" options={{ href: null }} />
  <Tabs.Screen name="profile" options={{ href: null }} />
  <Tabs.Screen name="settings" options={{ href: null }} />
  <Tabs.Screen name="more" options={{ href: null }} />
</Tabs>

);
}

const styles = StyleSheet.create({
bar: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
backgroundColor: theme.panel,
borderTopWidth: 1,
borderTopColor: theme.border,
paddingHorizontal: 6,
paddingTop: 9,
paddingBottom: 8,
},
iconButton: {
alignItems: 'center',
justifyContent: 'center',
minHeight: 36,
},
});
