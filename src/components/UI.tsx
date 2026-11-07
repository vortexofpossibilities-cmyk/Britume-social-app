
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

import { theme as C } from '../lib/theme';

type ChildrenProps = {
  children: React.ReactNode;
};

type ActionProps = {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
};

export function Page({ children, style, ...props }: ViewProps) {
  return (
    <View {...props} style={[styles.page, style]}>
      {children}
    </View>
  );
}

export function Heading({ children }: ChildrenProps) {
  return <Text style={styles.heading}>{children}</Text>;
}

export function Copy({ children }: ChildrenProps) {
  return <Text style={styles.copy}>{children}</Text>;
}

export function Panel({ children }: ChildrenProps) {
  return (
    <View style={styles.panel}>
      {children}
    </View>
  );
}

export function Action({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: ActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.action,
        secondary && styles.secondary,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[
          styles.actionText,
          secondary && styles.secondaryText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

type FieldProps = TextInputProps & {
  label: string;
};

export function Field({ label, ...props }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={C.muted}
        style={[
          styles.input,
          props.multiline && styles.multiline,
          props.style,
        ]}
      />
    </View>
  );
}

export function Busy() {
  return (
    <ActivityIndicator
      accessibilityLabel="Loading"
      color={C.cyan}
      size="large"
      style={styles.busy}
    />
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: C.bg,
    padding: 20,
  },
  heading: {
    color: C.text,
    fontSize: 25,
    fontWeight: '800',
    marginBottom: 8,
  },
  copy: {
    color: C.muted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
  },
  panel: {
    backgroundColor: C.panel,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  action: {
    backgroundColor: C.cyan,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  secondary: {
    backgroundColor: C.panel2,
    borderColor: C.border,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.55,
  },
  actionText: {
    color: '#081018',
    fontWeight: '800',
    fontSize: 14,
  },
  secondaryText: {
    color: C.text,
  },
  field: {
    marginTop: 12,
    marginBottom: 3,
  },
  label: {
    color: C.text,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 7,
  },
  input: {
    color: C.text,
    backgroundColor: C.panel,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  busy: {
    marginVertical: 24,
  },
});
