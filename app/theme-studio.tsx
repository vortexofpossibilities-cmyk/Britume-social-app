import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  useAppTheme,
  type AccentColourId,
} from '../src/contexts/ThemeContext';

const CATEGORIES = [
  'All',
  'Luxury',
  'Soft 3D',
  'Transparent',
  'Material',
  'Fantasy',
  'Creative',
  'Futuristic',
];

export default function ThemeStudioScreen() {
  const {
    theme,
    isDark,
    selectedTheme,
    selectedThemeStyle,
    accentColour,
    availableThemes,
    availableAccentColours,
    setSelectedTheme,
    setAccentColour,
  } = useAppTheme();

  const [category, setCategory] = useState('All');
  const [previewId, setPreviewId] = useState(selectedTheme);
  const [previewAccent, setPreviewAccent] =
    useState<AccentColourId>(accentColour);

  const previewTheme = useMemo(
    () =>
      availableThemes.find(item => item.id === previewId)
      ?? selectedThemeStyle,
    [availableThemes, previewId, selectedThemeStyle],
  );

  // AccentColour uses "value", not "color".
  const previewAccentValue =
    availableAccentColours.find(item => item.id === previewAccent)
      ?.value ?? '#168BFF';

  const filteredThemes = useMemo(
    () =>
      category === 'All'
        ? availableThemes
        : availableThemes.filter(item => item.category === category),
    [availableThemes, category],
  );

  const pageBackground = isDark ? '#101B2A' : '#F4F8FC';
  const mainText = isDark ? '#F2F7FF' : '#19334D';
  const mutedText = isDark ? '#A9BED3' : '#66829B';
  const surface = isDark ? '#1B2B40' : '#FFFFFF';
  const line = isDark ? '#304A65' : '#DCE7F1';

  const handleApply = async () => {
    await setSelectedTheme(previewId);
    await setAccentColour(previewAccent);
  };

  const renderThemeCard = (item: typeof availableThemes[number]) => {
    const active = previewId === item.id;
    const cardText = item.text;
    const cardMuted = item.muted;

    return (
      <Pressable
        key={item.id}
        onPress={() => setPreviewId(item.id)}
        style={[
          styles.themeCard,
          {
            backgroundColor: surface,
            borderColor: active ? previewAccentValue : line,
            borderWidth: active ? 2 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.themeSample,
            {
              backgroundColor: item.bg,
              borderColor: item.border,
              borderRadius: item.radius,
              shadowColor: item.shadow,
            },
          ]}
        >
          <View
            style={[
              styles.sampleHeader,
              { backgroundColor: item.panel },
            ]}
          >
            <View
              style={[
                styles.sampleDot,
                { backgroundColor: previewAccentValue },
              ]}
            />
            <View
              style={[
                styles.sampleLine,
                { backgroundColor: item.borderStrong },
              ]}
            />
            <View
              style={[
                styles.sampleDotSmall,
                { backgroundColor: item.highlight },
              ]}
            />
          </View>

          <View
            style={[
              styles.sampleCard,
              {
                backgroundColor: item.panel,
                borderColor: item.border,
                borderRadius: Math.max(8, item.radius - 8),
              },
            ]}
          >
            <View
              style={[
                styles.sampleTitle,
                { backgroundColor: cardText },
              ]}
            />
            <View
              style={[
                styles.sampleDescription,
                { backgroundColor: cardMuted },
              ]}
            />
            <View
              style={[
                styles.sampleButton,
                { backgroundColor: previewAccentValue },
              ]}
            />
          </View>

          <View style={styles.sampleBottom}>
            <View
              style={[
                styles.samplePill,
                { backgroundColor: item.panel2 },
              ]}
            />
            <View
              style={[
                styles.samplePill,
                { backgroundColor: item.panel3 },
              ]}
            />
          </View>
        </View>

        <View style={styles.themeCardFooter}>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.themeName, { color: mainText }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text
              style={[styles.themeDescription, { color: mutedText }]}
              numberOfLines={1}
            >
              {item.description}
            </Text>
          </View>

          {active && (
            <Ionicons
              name="checkmark-circle"
              size={23}
              color={previewAccentValue}
            />
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: pageBackground }]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={pageBackground}
      />

      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.backButton,
            { backgroundColor: surface, borderColor: line },
          ]}
        >
          <Ionicons name="arrow-back" size={23} color={mainText} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: mainText }]}>
            Theme Studio
          </Text>
          <Text style={[styles.headerSubtitle, { color: mutedText }]}>
            Create your own BRITUME world
          </Text>
        </View>

        <View
          style={[
            styles.countBadge,
            { backgroundColor: surface, borderColor: line },
          ]}
        >
          <Text style={{ color: previewAccentValue, fontWeight: '800' }}>
            35
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View
          style={[
            styles.previewContainer,
            {
              backgroundColor: previewTheme.bg,
              borderColor: previewTheme.border,
              borderRadius: previewTheme.radius,
              shadowColor: previewTheme.shadow,
            },
          ]}
        >
          <View style={styles.previewHeading}>
            <View>
              <Text style={styles.previewEyebrow}>
                LIVE MATERIAL PREVIEW
              </Text>
              <Text
                style={[
                  styles.previewTitle,
                  { color: previewTheme.text },
                ]}
              >
                {previewTheme.name}
              </Text>
            </View>

            <View
              style={[
                styles.previewTag,
                { backgroundColor: previewTheme.panel2 },
              ]}
            >
              <Text
                style={{
                  color: previewTheme.text,
                  fontSize: 11,
                  fontWeight: '800',
                }}
              >
                {previewTheme.material.toUpperCase()}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.previewAppCard,
              {
                backgroundColor: previewTheme.panel,
                borderColor: previewTheme.border,
                borderRadius: Math.max(12, previewTheme.radius - 4),
              },
            ]}
          >
            <View style={styles.previewProfile}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: previewAccentValue },
                ]}
              >
                <Ionicons name="person" size={20} color="#FFFFFF" />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.previewName,
                    { color: previewTheme.text },
                  ]}
                >
                  BRITUME Member
                </Text>
                <Text
                  style={[
                    styles.previewSmall,
                    { color: previewTheme.muted },
                  ]}
                >
                  Exploring a new world
                </Text>
              </View>

              <Ionicons
                name="ellipsis-horizontal"
                size={21}
                color={previewTheme.muted}
              />
            </View>

            <View
              style={[
                styles.previewContent,
                { backgroundColor: previewTheme.panel2 },
              ]}
            >
              <Text
                style={[
                  styles.previewContentTitle,
                  { color: previewTheme.text },
                ]}
              >
                Your world. Your style.
              </Text>
              <Text
                style={[
                  styles.previewSmall,
                  { color: previewTheme.muted },
                ]}
              >
                Experience BRITUME in your favourite material.
              </Text>

              <View
                style={[
                  styles.previewAction,
                  { backgroundColor: previewAccentValue },
                ]}
              >
                <Text style={styles.previewActionText}>Explore now</Text>
              </View>
            </View>

            <View style={styles.previewActions}>
              <Ionicons name="heart" size={19} color={previewAccentValue} />
              <Ionicons name="chatbubble" size={19} color={previewTheme.muted} />
              <Ionicons name="bookmark" size={19} color={previewTheme.muted} />
              <Ionicons name="share-social" size={19} color={previewTheme.muted} />
            </View>
          </View>

          <Text
            style={[
              styles.previewDescription,
              { color: previewTheme.muted },
            ]}
          >
            {previewTheme.description}
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: mainText }]}>
              Accent colours
            </Text>
            <Text style={[styles.sectionSubtitle, { color: mutedText }]}>
              Choose your own highlight colour
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.colourList}
        >
          {availableAccentColours.map(item => {
            const active = previewAccent === item.id;

            return (
              <Pressable
                key={item.id}
                onPress={() => setPreviewAccent(item.id)}
                style={styles.colourItem}
              >
                <View
                  style={[
                    styles.colourCircle,
                    {
                      // AccentColour uses "value", not "color".
                      backgroundColor: item.value,
                      borderColor: active ? mainText : 'transparent',
                    },
                  ]}
                >
                  {active && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={item.id === 'white' ? '#19334D' : '#FFFFFF'}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.colourName,
                    { color: mainText },
                  ]}
                >
                  {item.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: mainText }]}>
              Material worlds
            </Text>
            <Text style={[styles.sectionSubtitle, { color: mutedText }]}>
              {filteredThemes.length} styles available
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {CATEGORIES.map(item => {
            const active = category === item;

            return (
              <Pressable
                key={item}
                onPress={() => setCategory(item)}
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor: active ? previewAccentValue : surface,
                    borderColor: active ? previewAccentValue : line,
                  },
                ]}
              >
                <Text
                  style={{
                    color: active ? '#FFFFFF' : mainText,
                    fontSize: 12,
                    fontWeight: '700',
                  }}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.themeGrid}>
          {filteredThemes.map(renderThemeCard)}
        </View>

        <View style={{ height: 105 }} />
      </ScrollView>

      <View
        style={[
          styles.applyBar,
          {
            backgroundColor: surface,
            borderTopColor: line,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.applyTitle, { color: mainText }]}>
            {previewTheme.name}
          </Text>
          <Text style={[styles.applySubtitle, { color: mutedText }]}>
            {previewId === selectedTheme
              ? 'Currently applied'
              : 'Previewing a new material'}
          </Text>
        </View>

        <Pressable
          onPress={handleApply}
          style={[
            styles.applyButton,
            { backgroundColor: previewAccentValue },
          ]}
        >
          <Ionicons name="checkmark-circle" size={19} color="#FFFFFF" />
          <Text style={styles.applyButtonText}>Apply theme</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 13,
    gap: 12,
  },
  backButton: {
    width: 43,
    height: 43,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '900',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  countBadge: {
    minWidth: 42,
    height: 38,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingTop: 5,
  },
  previewContainer: {
    padding: 15,
    borderWidth: 1,
    marginBottom: 25,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  previewHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  previewEyebrow: {
    fontSize: 9,
    color: '#66829B',
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 3,
  },
  previewTag: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
  },
  previewAppCard: {
    borderWidth: 1,
    padding: 12,
  },
  previewProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 13,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewName: {
    fontWeight: '800',
    fontSize: 13,
  },
  previewSmall: {
    fontSize: 10,
    marginTop: 3,
    lineHeight: 15,
  },
  previewContent: {
    borderRadius: 15,
    padding: 13,
  },
  previewContentTitle: {
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 5,
  },
  previewAction: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 17,
    paddingVertical: 9,
    marginTop: 12,
  },
  previewActionText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 13,
  },
  previewDescription: {
    fontSize: 11,
    marginTop: 12,
    lineHeight: 17,
  },
  sectionHeader: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  sectionSubtitle: {
    fontSize: 11,
    marginTop: 3,
  },
  colourList: {
    gap: 17,
    paddingBottom: 23,
  },
  colourItem: {
    alignItems: 'center',
    width: 62,
  },
  colourCircle: {
    width: 43,
    height: 43,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colourName: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
  },
  categoryList: {
    gap: 8,
    paddingBottom: 15,
  },
  categoryButton: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  themeCard: {
    width: '48.5%',
    borderRadius: 17,
    borderWidth: 1,
    padding: 8,
    marginBottom: 2,
  },
  themeSample: {
    height: 112,
    padding: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sampleHeader: {
    height: 20,
    borderRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    gap: 5,
  },
  sampleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  sampleLine: {
    width: 30,
    height: 4,
    borderRadius: 3,
    flex: 1,
  },
  sampleDotSmall: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  sampleCard: {
    marginTop: 8,
    padding: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
  },
  sampleTitle: {
    height: 6,
    width: '65%',
    borderRadius: 4,
    marginBottom: 6,
  },
  sampleDescription: {
    height: 4,
    width: '85%',
    borderRadius: 3,
  },
  sampleButton: {
    height: 9,
    width: '40%',
    borderRadius: 6,
    marginTop: 8,
  },
  sampleBottom: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 7,
  },
  samplePill: {
    height: 7,
    flex: 1,
    borderRadius: 5,
  },
  themeCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingTop: 9,
    paddingBottom: 3,
  },
  themeName: {
    fontSize: 12,
    fontWeight: '900',
  },
  themeDescription: {
    fontSize: 9,
    marginTop: 3,
  },
  applyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  applyTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  applySubtitle: {
    fontSize: 10,
    marginTop: 3,
  },
  applyButton: {
    minHeight: 45,
    paddingHorizontal: 15,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
});
