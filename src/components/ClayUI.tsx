import React, { ReactNode } from 'react';
import {
  View,
  Text,
  Pressable,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeSurface, useThemeTokens } from './ThemeUI';

type ClayCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  radius?: number;
};

export function ClayCard({ children, style, padding = 16, radius }: ClayCardProps) {
  return (
    <ThemeSurface variant="card" padding={padding} radius={radius} style={style}>
      {children}
    </ThemeSurface>
  );
}

type ClayButtonProps = {
  title: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export function ClayButton({ title, onPress, icon, color, style }: ClayButtonProps) {
  const { theme, radius } = useThemeTokens();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [{
        minHeight: 52,
        paddingHorizontal: 20,
        borderRadius: theme.shape === 'square' ? 8 : theme.shape === 'pill' ? 999 : radius,
        backgroundColor: color ?? theme.accent,
        borderWidth: theme.cardBorderWidth,
        borderColor: theme.highlight,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,
        opacity: pressed ? 0.86 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: Math.max(2, theme.depth) },
        shadowOpacity: 0.24,
        shadowRadius: Math.max(3, theme.depth * 2),
        elevation: Math.max(1, Math.round(theme.depth)),
      }, style]}
    >
      {icon ? <Ionicons name={icon} size={21} color="#FFFFFF" /> : null}
      <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 15 }}>{title}</Text>
    </Pressable>
  );
}

type ClayIconProps = {
  name: React.ComponentProps<typeof Ionicons>['name'];
  size?: number;
  color?: string;
};

export function ClayIcon({ name, size = 25, color }: ClayIconProps) {
  const { theme, radius } = useThemeTokens();
  return (
    <View style={{
      width: 56,
      height: 56,
      borderRadius: theme.shape === 'square' ? 8 : radius,
      backgroundColor: theme.panel,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: theme.cardBorderWidth,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: Math.max(2, theme.depth) },
      shadowOpacity: 0.22,
      shadowRadius: Math.max(3, theme.depth * 2),
      elevation: Math.max(1, Math.round(theme.depth)),
    }}>
      <Ionicons name={name} size={size} color={color ?? theme.accent} />
    </View>
  );
}

// BRITUME brand mark; its surfaces and highlight adapt to the active material.
export function ClayLogo({ size = 76 }: { size?: number }) {
  const { theme, radius } = useThemeTokens();
  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: theme.shape === 'square' ? size * 0.12 : size * 0.29,
      backgroundColor: theme.accent,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: Math.max(1, theme.cardBorderWidth),
      borderColor: theme.highlight,
      shadowColor: theme.shadow,
      shadowOffset: { width: 5, height: 7 },
      shadowOpacity: 0.34,
      shadowRadius: 10,
      elevation: Math.max(4, Math.round(theme.depth) + 3),
    }}>
      <Text style={{
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: size * 0.72,
        textShadowColor: 'rgba(0,0,0,0.25)',
        textShadowOffset: { width: 2, height: 3 },
        textShadowRadius: 4,
      }}>B</Text>
      <View style={{
        position: 'absolute',
        width: size * 1.02,
        height: size * 0.28,
        borderRadius: size,
        borderWidth: Math.max(2, size * 0.045),
        borderColor: theme.highlight,
        backgroundColor: 'transparent',
        transform: [{ rotate: '-25deg' }],
        opacity: 0.9,
      }} />
    </View>
  );
}
