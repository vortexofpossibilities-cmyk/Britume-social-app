import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppTheme } from '../src/contexts/ThemeContext';

import { withThemeBackground } from '../src/components/ThemeScreen';

type ThemeItem = {
  id: string;
  name: string;
  category: string;
  description: string;
  material: string;
  bg: string;
  panel: string;
  panel2: string;
  panel3: string;
  text: string;
  muted: string;
  border: string;
  borderStrong: string;
  shadow: string;
  highlight: string;
  gradient: readonly string[];
  radius: number;
  borderWidth: number;
  glow: string;
  dark: boolean;
  backgroundType?: string;
  shape?: string;
  texture?: string;
  lighting?: string;
  depth: number;
  motion?: string;
};

const FILTERS = ['All', '3D', 'Nature', 'Luxury', 'Creative', 'Special'];

function getFilterCategory(item: ThemeItem) {
  const value = `${item.name} ${item.category} ${item.id}`.toLowerCase();

  if (
    value.includes('nature') ||
    value.includes('ocean') ||
    value.includes('forest') ||
    value.includes('aurora') ||
    value.includes('blossom') ||
    value.includes('sunset') ||
    value.includes('desert')
  ) {
    return 'Nature';
  }

  if (
    value.includes('gold') ||
    value.includes('royal') ||
    value.includes('marble') ||
    value.includes('wealth') ||
    value.includes('elite')
  ) {
    return 'Luxury';
  }

  if (
    value.includes('galaxy') ||
    value.includes('cyber') ||
    value.includes('holographic') ||
    value.includes('arcade') ||
    value.includes('unicorn') ||
    value.includes('neon')
  ) {
    return 'Creative';
  }

  if (
    value.includes('britume') ||
    value.includes('special') ||
    value.includes('success')
  ) {
    return 'Special';
  }

  return '3D';
}

function ThemeStudioScreen() {
  const {
    theme,
    selectedTheme,
    selectedThemeStyle,
    availableThemes,
    setSelectedTheme,
  } = useAppTheme();

  const [previewId, setPreviewId] = useState(selectedTheme);
  const [activeFilter, setActiveFilter] = useState('All');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    setPreviewId(selectedTheme);
  }, [selectedTheme]);

  const previewTheme = useMemo(() => {
    return (
      availableThemes.find((item: ThemeItem) => item.id === previewId) ??
      selectedThemeStyle
    ) as ThemeItem;
  }, [availableThemes, previewId, selectedThemeStyle]);

  const filteredThemes = useMemo(() => {
    if (activeFilter === 'All') return availableThemes;

    return availableThemes.filter((item: ThemeItem) => {
      return getFilterCategory(item) === activeFilter;
    });
  }, [availableThemes, activeFilter]);

  const isAlreadyApplied = previewId === selectedTheme;

  const applyTheme = async () => {
    if (applying || isAlreadyApplied) return;

    try {
      setApplying(true);
      await Promise.resolve(setSelectedTheme(previewId));
    } catch (error) {
      console.error('Could not apply BRITUME theme:', error);
    } finally {
      setApplying(false);
    }
  };

  const styles = createStyles(theme);

  if (!previewTheme) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.blue} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Preparing BRITUME Theme Studio...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="arrow-back"
              size={23}
              color={theme.text}
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Theme Studio</Text>
            <Text style={styles.headerSubtitle}>
              Transform your BRITUME experience
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="color-palette"
              size={25}
              color={theme.blue}
            />
          </View>
        </View>

        {/* INTRODUCTION */}
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <Ionicons
              name="sparkles"
              size={29}
              color={theme.highlight}
            />
          </View>

          <Text style={styles.introTitle}>
            Your world. Your design.
          </Text>

          <Text style={styles.introDescription}>
            Choose a new visual experience. Change the atmosphere,
            backgrounds, surfaces, colours and shapes of BRITUME.
          </Text>

          <View style={styles.freeLabel}>
            <Ionicons
              name="gift-outline"
              size={15}
              color={theme.success}
            />
            <Text style={styles.freeLabelText}>
              All 30 themes are free
            </Text>
          </View>
        </View>

        {/* LIVE PREVIEW */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Live Preview</Text>
          <Text style={styles.sectionCaption}>
            Preview before applying
          </Text>
        </View>

        <View
          style={[
            styles.previewContainer,
            {
              backgroundColor: previewTheme.bg,
              borderColor: previewTheme.borderStrong,
              borderRadius: previewTheme.radius,
              borderWidth: Math.max(1, previewTheme.borderWidth),
            },
          ]}
        >
          <View style={styles.previewTop}>
            <View style={styles.previewBrand}>
              <View
                style={[
                  styles.previewLogo,
                  { backgroundColor: previewTheme.gradient[0] },
                ]}
              >
                <Ionicons
                  name="aperture"
                  size={22}
                  color="#FFFFFF"
                />
              </View>

              <View>
                <Text
                  style={[
                    styles.previewBrandName,
                    { color: previewTheme.text },
                  ]}
                >
                  BRITUME
                </Text>
                <Text
                  style={[
                    styles.previewBrandSubtitle,
                    { color: previewTheme.muted },
                  ]}
                >
                  Vortex of Possibilities
                </Text>
              </View>
            </View>

            <Ionicons
              name="notifications-outline"
              size={22}
              color={previewTheme.text}
            />
          </View>

          <View
            style={[
              styles.previewProfileCard,
              {
                backgroundColor: previewTheme.panel,
                borderColor: previewTheme.border,
                borderRadius: previewTheme.radius,
              },
            ]}
          >
            <View style={styles.previewProfileRow}>
              <View
                style={[
                  styles.previewAvatar,
                  { backgroundColor: previewTheme.gradient[1] },
                ]}
              >
                <Ionicons
                  name="person"
                  size={25}
                  color="#FFFFFF"
                />
              </View>

              <View style={styles.previewProfileInfo}>
                <Text
                  style={[
                    styles.previewName,
                    { color: previewTheme.text },
                  ]}
                >
                  Your Profile
                </Text>
                <Text
                  style={[
                    styles.previewMuted,
                    { color: previewTheme.muted },
                  ]}
                >
                  Welcome to your world
                </Text>
              </View>

              <Ionicons
                name="ellipsis-horizontal"
                size={22}
                color={previewTheme.text}
              />
            </View>

            <Text
              style={[
                styles.previewPostText,
                { color: previewTheme.text },
              ]}
            >
              Discover something amazing today!
            </Text>

            <View
              style={[
                styles.previewMedia,
                {
                  backgroundColor: previewTheme.panel2,
                  borderColor: previewTheme.border,
                  borderRadius: previewTheme.radius,
                },
              ]}
            >
              <Ionicons
                name="images-outline"
                size={35}
                color={previewTheme.gradient[0]}
              />
              <Text
                style={[
                  styles.previewMediaText,
                  { color: previewTheme.muted },
                ]}
              >
                Your themed content preview
              </Text>
            </View>

            <View style={styles.previewActions}>
              <View style={styles.previewAction}>
                <Ionicons
                  name="heart-outline"
                  size={19}
                  color={previewTheme.gradient[0]}
                />
                <Text style={[styles.previewMuted, { color: previewTheme.muted }]}>
                  Like
                </Text>
              </View>

              <View style={styles.previewAction}>
                <Ionicons
                  name="chatbubble-outline"
                  size={19}
                  color={previewTheme.text}
                />
                <Text style={[styles.previewMuted, { color: previewTheme.muted }]}>
                  Comment
                </Text>
              </View>

              <View style={styles.previewAction}>
                <Ionicons
                  name="share-social-outline"
                  size={19}
                  color={previewTheme.text}
                />
                <Text style={[styles.previewMuted, { color: previewTheme.muted }]}>
                  Share
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.previewBottom}>
            <View style={styles.previewColourRow}>
              {previewTheme.gradient.slice(0, 3).map(
                (colour: string, index: number) => (
                  <View
                    key={`${colour}-${index}`}
                    style={[
                      styles.colourDot,
                      { backgroundColor: colour },
                    ]}
                  />
                )
              )}
            </View>

            <Text
              style={[
                styles.previewBottomText,
                { color: previewTheme.muted },
              ]}
            >
              Theme preview
            </Text>
          </View>
        </View>

        {/* SELECTED THEME DETAILS */}
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedName}>
            {previewTheme.name}
          </Text>

          <Text style={styles.selectedDescription}>
            {previewTheme.description}
          </Text>

          <View style={styles.detailTags}>
            <View style={styles.detailTag}>
              <Text style={styles.detailTagText}>
                {previewTheme.material}
              </Text>
            </View>

            <View style={styles.detailTag}>
              <Text style={styles.detailTagText}>
                {previewTheme.category}
              </Text>
            </View>

            {previewTheme.shape ? (
              <View style={styles.detailTag}>
                <Text style={styles.detailTagText}>
                  {previewTheme.shape}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={applyTheme}
          disabled={applying || isAlreadyApplied}
          style={[
            styles.applyButton,
            {
              backgroundColor: isAlreadyApplied
                ? theme.panel2
                : theme.blue,
              opacity: applying ? 0.7 : 1,
            },
          ]}
        >
          {applying ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Ionicons
              name={isAlreadyApplied ? 'checkmark-circle' : 'sparkles'}
              size={21}
              color={isAlreadyApplied ? theme.text : '#FFFFFF'}
            />
          )}

          <Text
            style={[
              styles.applyButtonText,
              { color: isAlreadyApplied ? theme.text : '#FFFFFF' },
            ]}
          >
            {applying
              ? 'Applying Theme...'
              : isAlreadyApplied
                ? 'Currently Applied'
                : 'Apply This Theme'}
          </Text>
        </Pressable>

        {/* FILTERS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explore Themes</Text>
          <Text style={styles.sectionCaption}>
            {availableThemes.length} designs
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        >
          {FILTERS.map((filter) => {
            const active = activeFilter === filter;

            return (
              <Pressable
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: active ? theme.blue : theme.panel,
                    borderColor: active ? theme.blue : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: active ? '#FFFFFF' : theme.text },
                  ]}
                >
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* THEME CATALOGUE */}
        <View style={styles.themeGrid}>
          {filteredThemes.map((item: ThemeItem) => {
            const isSelected = selectedTheme === item.id;
            const isPreviewing = previewId === item.id;

            return (
              <Pressable
                key={item.id}
                onPress={() => setPreviewId(item.id)}
                style={[
                  styles.themeCard,
                  {
                    backgroundColor: item.panel,
                    borderColor: isPreviewing
                      ? theme.blue
                      : item.border,
                    borderWidth: isPreviewing ? 2 : 1,
                    borderRadius: item.radius,
                  },
                ]}
              >
                <View
                  style={[
                    styles.themeArtwork,
                    {
                      backgroundColor: item.bg,
                      borderRadius: Math.max(8, item.radius - 5),
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.artworkShape,
                      {
                        backgroundColor: item.gradient[0],
                        borderRadius: item.radius,
                      },
                    ]}
                  />

                  <View
                    style={[
                      styles.artworkShapeSmall,
                      {
                        backgroundColor: item.gradient[1],
                        borderRadius: item.radius,
                      },
                    ]}
                  />

                  <View
                    style={[
                      styles.artworkShapeTiny,
                      {
                        backgroundColor: item.gradient[2],
                        borderRadius: item.radius,
                      },
                    ]}
                  />

                  {isSelected && (
                    <View style={styles.appliedBadge}>
                      <Ionicons
                        name="checkmark"
                        size={12}
                        color="#FFFFFF"
                      />
                      <Text style={styles.appliedBadgeText}>
                        Applied
                      </Text>
                    </View>
                  )}

                  {isPreviewing && !isSelected && (
                    <View style={styles.previewBadge}>
                      <Text style={styles.previewBadgeText}>
                        Previewing
                      </Text>
                    </View>
                  )}
                </View>

                <Text
                  numberOfLines={1}
                  style={[
                    styles.themeName,
                    { color: item.text },
                  ]}
                >
                  {item.name}
                </Text>

                <Text
                  numberOfLines={1}
                  style={[
                    styles.themeCategory,
                    { color: item.muted },
                  ]}
                >
                  {item.category}
                </Text>

                <View style={styles.themeCardBottom}>
                  <View style={styles.miniColourRow}>
                    {item.gradient.slice(0, 3).map(
                      (colour: string, index: number) => (
                        <View
                          key={`${item.id}-${index}`}
                          style={[
                            styles.miniColourDot,
                            { backgroundColor: colour },
                          ]}
                        />
                      )
                    )}
                  </View>

                  <Ionicons
                    name={
                      isPreviewing
                        ? 'radio-button-on'
                        : 'radio-button-off'
                    }
                    size={19}
                    color={isPreviewing ? theme.blue : item.muted}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>

        {filteredThemes.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons
              name="color-palette-outline"
              size={35}
              color={theme.muted}
            />
            <Text style={styles.emptyText}>
              No themes in this category yet.
            </Text>
          </View>
        )}

        {/* FOOTER */}
        <View style={styles.footer}>
          <Ionicons
            name="shield-checkmark-outline"
            size={19}
            color={theme.success}
          />
          <Text style={styles.footerText}>
            Your theme choice is saved through BRITUME Theme Settings.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 45,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    loadingText: {
      fontSize: 14,
      fontWeight: '600',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 22,
      gap: 12,
    },
    backButton: {
      width: 43,
      height: 43,
      borderRadius: 15,
      backgroundColor: theme.panel,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    headerText: {
      flex: 1,
    },
    headerTitle: {
      color: theme.text,
      fontSize: 23,
      fontWeight: '900',
    },
    headerSubtitle: {
      color: theme.muted,
      fontSize: 12,
      marginTop: 3,
    },
    headerIcon: {
      width: 43,
      height: 43,
      borderRadius: 15,
      backgroundColor: theme.panel,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    introCard: {
      backgroundColor: theme.panel,
      padding: 19,
      borderRadius: 23,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 24,
    },
    introIcon: {
      width: 49,
      height: 49,
      borderRadius: 17,
      backgroundColor: theme.panel2,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 13,
    },
    introTitle: {
      fontSize: 21,
      fontWeight: '900',
      color: theme.text,
    },
    introDescription: {
      fontSize: 13,
      lineHeight: 20,
      color: theme.muted,
      marginTop: 7,
    },
    freeLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      backgroundColor: theme.panel2,
      paddingHorizontal: 11,
      paddingVertical: 7,
      borderRadius: 20,
      marginTop: 14,
    },
    freeLabelText: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.success,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      marginTop: 5,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: theme.text,
    },
    sectionCaption: {
      fontSize: 11,
      color: theme.muted,
    },
    previewContainer: {
      padding: 13,
      overflow: 'hidden',
      marginBottom: 14,
    },
    previewTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    previewBrand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },
    previewLogo: {
      width: 39,
      height: 39,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewBrandName: {
      fontSize: 14,
      fontWeight: '900',
    },
    previewBrandSubtitle: {
      fontSize: 9,
      marginTop: 2,
    },
    previewProfileCard: {
      padding: 13,
      borderWidth: 1,
    },
    previewProfileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    previewAvatar: {
      width: 43,
      height: 43,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewProfileInfo: {
      flex: 1,
    },
    previewName: {
      fontSize: 13,
      fontWeight: '800',
    },
    previewMuted: {
      fontSize: 10,
    },
    previewPostText: {
      fontSize: 12,
      marginTop: 14,
      marginBottom: 12,
    },
    previewMedia: {
      height: 105,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
    },
    previewMediaText: {
      fontSize: 10,
    },
    previewActions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 13,
    },
    previewAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    previewBottom: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
    },
    previewColourRow: {
      flexDirection: 'row',
      gap: 6,
    },
    colourDot: {
      width: 15,
      height: 15,
      borderRadius: 8,
    },
    previewBottomText: {
      fontSize: 10,
    },
    selectedInfo: {
      marginBottom: 13,
    },
    selectedName: {
      fontSize: 19,
      fontWeight: '900',
      color: theme.text,
    },
    selectedDescription: {
      fontSize: 12,
      lineHeight: 19,
      color: theme.muted,
      marginTop: 5,
    },
    detailTags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
      marginTop: 10,
    },
    detailTag: {
      backgroundColor: theme.panel2,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
    },
    detailTagText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.text,
      textTransform: 'capitalize',
    },
    applyButton: {
      minHeight: 51,
      borderRadius: 16,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 9,
      marginBottom: 27,
    },
    applyButtonText: {
      fontSize: 14,
      fontWeight: '900',
    },
    filterList: {
      gap: 8,
      paddingBottom: 14,
    },
    filterButton: {
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 20,
      borderWidth: 1,
    },
    filterText: {
      fontSize: 11,
      fontWeight: '800',
    },
    themeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 12,
    },
    themeCard: {
      width: '48.3%',
      padding: 9,
      borderWidth: 1,
      overflow: 'hidden',
    },
    themeArtwork: {
      height: 105,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
      marginBottom: 9,
    },
    artworkShape: {
      width: 62,
      height: 62,
      position: 'absolute',
      transform: [{ rotate: '25deg' }],
    },
    artworkShapeSmall: {
      width: 39,
      height: 39,
      position: 'absolute',
      top: 12,
      right: 18,
      opacity: 0.9,
      transform: [{ rotate: '35deg' }],
    },
    artworkShapeTiny: {
      width: 25,
      height: 25,
      position: 'absolute',
      bottom: 12,
      left: 19,
      opacity: 0.9,
      transform: [{ rotate: '15deg' }],
    },
    appliedBadge: {
      position: 'absolute',
      top: 6,
      left: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: '#159B65',
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 10,
    },
    appliedBadgeText: {
      fontSize: 8,
      fontWeight: '900',
      color: '#FFFFFF',
    },
    previewBadge: {
      position: 'absolute',
      top: 6,
      left: 6,
      backgroundColor: theme.blue,
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 10,
    },
    previewBadgeText: {
      fontSize: 8,
      fontWeight: '900',
      color: '#FFFFFF',
    },
    themeName: {
      fontSize: 12,
      fontWeight: '900',
    },
    themeCategory: {
      fontSize: 10,
      marginTop: 3,
    },
    themeCardBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    miniColourRow: {
      flexDirection: 'row',
      gap: 4,
    },
    miniColourDot: {
      width: 11,
      height: 11,
      borderRadius: 6,
    },
    emptyState: {
      alignItems: 'center',
      padding: 25,
      gap: 10,
    },
    emptyText: {
      color: theme.muted,
      fontSize: 12,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      marginTop: 24,
      padding: 13,
      borderRadius: 14,
      backgroundColor: theme.panel,
    },
    footerText: {
      flex: 1,
      fontSize: 10,
      lineHeight: 16,
      color: theme.muted,
    },
  });
}

export default withThemeBackground(ThemeStudioScreen);
