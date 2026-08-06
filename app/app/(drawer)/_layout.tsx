import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function DrawerLayout() {
  const { isDark, colors } = useTheme();

  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textSecondary,
        drawerStyle: {
          backgroundColor: colors.card,
          width: 280,
        },
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '600',
        },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: 'Dashboard',
          drawerIcon: ({ color }: { color: string }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Drawer.Screen
        name="history"
        options={{
          title: 'History',
          drawerIcon: ({ color }: { color: string }) => <Ionicons name="time" size={24} color={color} />,
        }}
      />
      <Drawer.Screen
        name="templates"
        options={{
          title: 'Templates',
          drawerIcon: ({ color }: { color: string }) => <Ionicons name="document-text" size={24} color={color} />,
        }}
      />
      <Drawer.Screen
        name="chat"
        options={{
          title: 'AI Legal Chat',
          drawerIcon: ({ color }: { color: string }) => <Ionicons name="chatbubbles" size={24} color={color} />,
        }}
      />
      <Drawer.Screen
        name="legal-translator"
        options={{
          title: 'Legal Translator',
          drawerIcon: ({ color }: { color: string }) => <Ionicons name="language-outline" size={24} color={color} />,
        }}
      />

      <Drawer.Screen
        name="settings"
        options={{
          title: 'Settings',
          drawerIcon: ({ color }: { color: string }) => <Ionicons name="settings" size={24} color={color} />,
        }}
      />
    </Drawer>
  );
}
