import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewProps,
} from 'react-native';
import { useAppTheme } from '../contexts/ThemeContext';

type ChildrenProps = { children: React.ReactNode };
type ActionProps = {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
};

export function Page({ children, style, ...props }: ViewProps) {
  const { theme } = useAppTheme();
  return <View {...props} style={[{ flex: 1, backgroundColor: theme.bg, padding: 20 }, style]}>{children}</View>;
}

export function Heading({ children }: ChildrenProps) {
  const { theme } = useAppTheme();
  return <Text style={{ color: theme.text, fontSize: 25, fontWeight: '800', marginBottom: 8 }}>{children}</Text>;
}

export function Copy({ children }: ChildrenProps) {
  const { theme } = useAppTheme();
  return <Text style={{ color: theme.muted, fontSize: 14, lineHeight: 21, marginBottom: 12 }}>{children}</Text>;
}

export function Panel({ children }: ChildrenProps) {
  const { theme } = useAppTheme();
  return <View style={{ backgroundColor: theme.panel, borderColor: theme.border, borderWidth: theme.cardBorderWidth, borderRadius: theme.cardRadius, padding: 16, marginVertical: 8 }}>{children}</View>;
}

export function Action({ title, onPress, secondary = false, disabled = false }: ActionProps) {
  const { theme } = useAppTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title}
      accessibilityState={{ disabled }} onPress={onPress} disabled={disabled}
      style={({ pressed }) => ({ backgroundColor: secondary ? theme.panel2 : theme.accent,
        borderColor: theme.border, borderWidth: secondary ? 1 : 0,
        borderRadius: theme.cardRadius, paddingVertical: 14, paddingHorizontal: 16,
        alignItems: 'center', marginTop: 12, opacity: disabled ? 0.55 : pressed ? 0.8 : 1 })}>
      <Text style={{ color: secondary ? theme.text : '#FFFFFF', fontWeight: '800', fontSize: 14 }}>{title}</Text>
    </Pressable>
  );
}

type FieldProps = TextInputProps & { label: string };
export function Field({ label, ...props }: FieldProps) {
  const { theme } = useAppTheme();
  return (
    <View style={{ marginTop: 12, marginBottom: 3 }}>
      <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700', marginBottom: 7 }}>{label}</Text>
      <TextInput {...props} accessibilityLabel={label} placeholderTextColor={theme.muted}
        style={[{ color: theme.text, backgroundColor: theme.panel, borderColor: theme.border,
          borderWidth: 1, borderRadius: theme.cardRadius, paddingHorizontal: 14,
          paddingVertical: 13, fontSize: 14 }, props.multiline && { minHeight: 120, textAlignVertical: 'top' }, props.style]} />
    </View>
  );
}

export function Busy() {
  const { theme } = useAppTheme();
  return <ActivityIndicator accessibilityLabel="Loading" color={theme.accent} size="large" style={{ marginVertical: 24 }} />;
}
