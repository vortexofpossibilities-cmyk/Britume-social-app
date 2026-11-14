import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewProps,
} from 'react-native';
import { useAppTheme } from '../contexts/ThemeContext';
import { ThemeBackground, ThemeSurface } from './ThemeUI';

type ChildrenProps = { children: React.ReactNode };
type ActionProps = {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
};

export function Page({ children, style, ...props }: ViewProps) {
  return (
    <ThemeBackground style={[styles.page, style]}>
      <View {...props} style={styles.pageContent}>{children}</View>
    </ThemeBackground>
  );
}

export function Heading({ children }: ChildrenProps) {
  const { theme } = useAppTheme();
  return <Text style={[styles.heading, { color: theme.text }]}>{children}</Text>;
}

export function Copy({ children }: ChildrenProps) {
  const { theme } = useAppTheme();
  return <Text style={[styles.copy, { color: theme.muted }]}>{children}</Text>;
}

export function Panel({ children }: ChildrenProps) {
  return (
    <ThemeSurface variant="card" padding={16} style={styles.panel}>
      {children}
    </ThemeSurface>
  );
}

export function Action({ title, onPress, secondary = false, disabled = false }: ActionProps) {
  const { theme, isDark } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.action,
        {
          backgroundColor: secondary ? theme.panel2 : theme.accent,
          borderColor: secondary ? theme.borderStrong : theme.highlight,
          shadowColor: theme.shadow,
          shadowOpacity: pressed ? 0.08 : 0.3,
          shadowOffset: { width: 0, height: pressed ? 1 : Math.max(4, theme.depth) },
          shadowRadius: pressed ? 2 : Math.max(6, theme.depth * 2),
          elevation: pressed ? 1 : Math.max(4, theme.depth + 1),
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: pressed && !disabled ? 0.97 : 1 }],
        },
      ]}
    >
      <Text style={[styles.actionText, { color: secondary ? theme.text : '#FFFFFF' }]}>{title}</Text>
    </Pressable>
  );
}

type FieldProps = TextInputProps & { label: string };
export function Field({ label, ...props }: FieldProps) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={theme.muted}
        style={[
          styles.input,
          { color: theme.text, backgroundColor: theme.panel, borderColor: theme.border },
          props.multiline && styles.multiline,
          props.style,
        ]}
      />
    </View>
  );
}

export function Busy() {
  const { theme } = useAppTheme();
  return <ActivityIndicator accessibilityLabel="Loading" color={theme.accent} size="large" style={styles.busy} />;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  pageContent: { flex: 1, padding: 20 },
  heading: { fontSize: 25, fontWeight: '800', marginBottom: 8 },
  copy: { fontSize: 14, lineHeight: 21, marginBottom: 12 },
  panel: { marginVertical: 8 },
  action: {
    minHeight: 48,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  actionText: { fontWeight: '800', fontSize: 14 },
  field: { marginTop: 12, marginBottom: 3 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 7 },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
  },
  multiline: { minHeight: 120, textAlignVertical: 'top' },
  busy: { marginVertical: 24 },
});
