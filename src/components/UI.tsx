import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewProps } from 'react-native';
import { theme as C } from '../lib/theme';

export function Page({ children, style, ...props }: ViewProps) {
  return <View {...props} style={[styles.page, style]}>{children}</View>;
}
export function Heading({ children }: { children: React.ReactNode }) {
  return <Text style={styles.heading}>{children}</Text>;
}
export function Copy({ children }: { children: React.ReactNode }) {
  return <Text style={styles.copy}>{children}</Text>;
}
export function Panel({ children }: { children: React.ReactNode }) {
  return <View style={styles.panel}>{children}</View>;
}
export function Action({ title, onPress, secondary, disabled }: {
  title: string; onPress: () => void; secondary?: boolean; disabled?: boolean;
}) {
  return <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled}
    style={[styles.action, secondary && styles.secondary, disabled && { opacity: 0.55 }]}>
    <Text style={[styles.actionText, secondary && { color: C.text }]}>{title}</Text>
  </Pressable>;
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput {...props} placeholderTextColor={C.muted} style={[styles.input, props.multiline && { minHeight: 120, textAlignVertical: 'top' }]} />
  </View>;
}
export function Busy() { return <ActivityIndicator color={C.cyan} size="large" style={{ marginVertical: 24 }} />; }

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg, padding: 20 },
  heading: { color: C.text, fontSize: 25, fontWeight: '800', marginBottom: 8 },
  copy: { color: C.muted, fontSize: 14, lineHeight: 21, marginBottom: 12 },
  panel: { backgroundColor: C.panel, borderColor: C.border, borderWidth: 1, borderRadius: 16, padding: 16, marginVertical: 8 },
  action: { backgroundColor: C.cyan, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', marginTop: 12 },
  secondary: { backgroundColor: C.panel2, borderColor: C.border, borderWidth: 1 },
  actionText: { color: '#081018', fontWeight: '800', fontSize: 14 },
  field: { marginTop: 12, marginBottom: 3 },
  label: { color: C.text, fontSize: 12, fontWeight: '700', marginBottom: 7 },
  input: { color: C.text, backgroundColor: C.panel, borderColor: C.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14 },
});
