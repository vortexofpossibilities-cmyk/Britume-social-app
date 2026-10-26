
import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../lib/theme';

type Feature = {
  title: string;
  description: string;
};

type FeatureAction = {
  label: string;
  route: string;
};

export function FeaturePage({
  title,
  intro,
  features,
  actions = [],
}: {
  title: string;
  intro: string;
  features: Feature[];
  actions?: FeatureAction[];
}) {
  const router = useRouter();

  return (
    <ScrollView style={styles.screen}
      contentContainerStyle={styles.content}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.intro}>{intro}</Text>

      {features.map((feature, index) => (
        <View key={feature.title + index} style={styles.card}>
          <Text style={styles.cardTitle}>{feature.title}</Text>
          <Text style={styles.description}>
            {feature.description}
          </Text>
        </View>
      ))}

      {actions.map((action) => (
        <Pressable
          key={action.route}
          accessibilityRole="button"
          onPress={() => router.push(action.route as never)}
          style={styles.button}
        >
          <Text style={styles.buttonText}>{action.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 20, paddingBottom: 36 },
  title: {
    color: theme.text, fontSize: 27,
    fontWeight: '900', marginBottom: 8,
  },
  intro: {
    color: theme.muted, fontSize: 15,
    lineHeight: 22, marginBottom: 18,
  },
  card: {
    backgroundColor: theme.panel,
    borderColor: theme.border,
    borderWidth: 1, borderRadius: 16,
    padding: 16, marginBottom: 12,
  },
  cardTitle: {
    color: theme.text, fontSize: 16,
    fontWeight: '800', marginBottom: 6,
  },
  description: {
    color: theme.muted, fontSize: 14, lineHeight: 21,
  },
  button: {
    backgroundColor: theme.cyan,
    borderRadius: 12, padding: 13, marginBottom: 10,
  },
  buttonText: {
    color: theme.bg, fontWeight: '800', textAlign: 'center',
  },
});
