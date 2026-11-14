import React, { ReactNode } from 'react';
import {
  Pressable,
  StyleProp,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useAppTheme } from '../contexts/ThemeContext';

type SurfaceVariant = 'card' | 'raised' | 'glass' | 'flat';

function getShapeRadius(shape: string, fallback: number) {
  switch (shape) {
    case 'square': return 8;
    case 'pill': return 999;
    case 'soft': return Math.max(24, fallback);
    case 'hexagon': return Math.max(16, Math.min(22, fallback));
    case 'geometric': return Math.max(12, Math.min(18, fallback));
    case 'mixed': return fallback;
    case 'rounded':
    default: return fallback;
  }
}

export function useThemeTokens() {
  const { theme, isDark } = useAppTheme();
  return { theme, isDark, radius: getShapeRadius(theme.shape, theme.cardRadius) };
}

type ThemeBackgroundProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function ThemeBackground({ children, style }: ThemeBackgroundProps) {
  const { theme } = useThemeTokens();
  const decorative = theme.backgroundType !== 'plain';
  const glowOpacity = Math.min(0.34, 0.10 + theme.depth * 0.025);

  return (
    <View style={[{ flex: 1, backgroundColor: theme.bg, overflow: 'hidden' }, style]}>
      {decorative && (
        <>
          <View pointerEvents="none" style={{
            position: 'absolute', width: '115%', height: '48%', top: -90,
            left: '-22%', borderRadius: 999,
            backgroundColor: theme.backgroundGradient[0], opacity: glowOpacity,
          }} />
          <View pointerEvents="none" style={{
            position: 'absolute', width: '90%', height: '42%', bottom: -100,
            right: '-28%', borderRadius: 999,
            backgroundColor: theme.backgroundGradient[2], opacity: glowOpacity * 0.8,
          }} />
          {theme.backgroundType === 'tiles' && (
            <View pointerEvents="none" style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              borderWidth: 12, borderColor: theme.border, opacity: 0.18,
            }} />
          )}
          {theme.backgroundType === 'rainbow-mesh' && (
            <View pointerEvents="none" style={{
              position: 'absolute', top: '20%', left: '-15%', width: '130%',
              height: '36%', borderRadius: 999, borderWidth: 18,
              borderColor: theme.highlight, opacity: 0.10,
            }} />
          )}
        </>
      )}
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

type ThemeSurfaceProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  variant?: SurfaceVariant;
  radius?: number;
};

export function ThemeSurface({
  children, style, padding = 16, variant = 'card', radius,
}: ThemeSurfaceProps) {
  const { theme, radius: shapeRadius } = useThemeTokens();
  const backgroundColor = variant === 'glass'
    ? theme.glass
    : variant === 'raised'
      ? theme.panel2
      : variant === 'flat'
        ? theme.panel3
        : theme.panel;

  return (
    <View style={[{
      padding,
      backgroundColor,
      borderRadius: radius ?? shapeRadius,
      borderWidth: variant === 'flat' ? 0 : theme.cardBorderWidth,
      borderColor: variant === 'glass' ? theme.glassBorder : theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: Math.max(4, theme.depth + 3) },
      shadowOpacity: Math.min(0.34, 0.14 + theme.depth * 0.025),
      shadowRadius: Math.max(6, theme.depth * 2.2),
      elevation: Math.max(3, Math.round(theme.depth + 1)),
    }, style]}>
      <View pointerEvents="none" style={{
        position: 'absolute', top: 0, left: 12, right: 12, height: 2,
        borderRadius: 4, backgroundColor: theme.highlight, opacity: 0.45,
      }} />
      {children}
    </View>
  );
}

type ThemeTileProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padding?: number;
  selected?: boolean;
};

export function ThemeTile({
  children, style, onPress, padding = 14, selected = false,
}: ThemeTileProps) {
  const { theme, radius } = useThemeTokens();
  const tileRadius = theme.shape === 'square' ? 8
    : theme.shape === 'pill' ? 26
      : theme.shape === 'hexagon' ? 18
        : radius;

  const content = (
    <View style={[{
      minHeight: 72,
      padding,
      justifyContent: 'center',
      backgroundColor: theme.panel,
      borderRadius: tileRadius,
      borderWidth: selected ? Math.max(2, theme.cardBorderWidth) : theme.cardBorderWidth,
      borderColor: selected ? theme.accent : theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: Math.max(4, theme.depth + 2) },
      shadowOpacity: Math.min(0.32, 0.12 + theme.depth * 0.025),
      shadowRadius: Math.max(6, theme.depth * 2),
      elevation: Math.max(3, Math.round(theme.depth + 1)),
    }, style]}>
      <View pointerEvents="none" style={{
        position: 'absolute', top: 0, left: 8, right: 8, height: 2,
        backgroundColor: theme.highlight, opacity: 0.55,
      }} />
      {children}
    </View>
  );

  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button">{content}</Pressable>
  ) : content;
}

type ThemeButtonProps = {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
};

export function ThemeButton({
  title, onPress, style, textStyle, disabled = false,
}: ThemeButtonProps) {
  const { theme, radius } = useThemeTokens();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [{
        minHeight: 48,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.shape === 'square' ? 8 : theme.shape === 'pill' ? 999 : radius,
        backgroundColor: disabled ? theme.panel2 : theme.accent,
        borderWidth: theme.cardBorderWidth,
        borderColor: theme.highlight,
        opacity: disabled ? 0.55 : pressed ? 0.82 : 1,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: pressed ? 1 : Math.max(2, theme.depth) },
        shadowOpacity: pressed ? 0.10 : 0.30,
        shadowRadius: pressed ? 2 : Math.max(6, theme.depth * 1.8),
        elevation: pressed ? 1 : Math.max(3, Math.round(theme.depth + 1)),
      }, style]}
    >
      <Text style={[{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }, textStyle]}>
        {title}
      </Text>
    </Pressable>
  );
}

type ThemeLabelProps = {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  muted?: boolean;
};

export function ThemeLabel({ children, style, muted = false }: ThemeLabelProps) {
  const { theme } = useThemeTokens();
  return (
    <Text style={[{
      color: muted ? theme.muted : theme.text,
      fontWeight: '600',
    }, style]}>
      {children}
    </Text>
  );
}
