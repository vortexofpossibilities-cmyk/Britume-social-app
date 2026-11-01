
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { theme } from '../src/lib/theme';

type Filter = 'All' | 'Unread' | 'Groups';

export default function MessagesScreen() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('All');

  const filters: Filter[] = ['All', 'Unread', 'Groups'];

  const startMessage = () => {
    Alert.alert(
      'New message',
      'Direct messaging will be available when the BRITUME messaging backend is connected.'
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={23} color={theme.blueDark} />
          </Pressable>

          <View style={styles.brand}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>B</Text>
            </View>
            <View>
              <Text style={styles.brandName}>BRITUME</Text>
              <Text style={styles.tagline}>Vortex of Possibilities</Text>
            </View>
          </View>

          <Pressable
            style={styles.headerButton}
            onPress={startMessage}
          >
            <Ionicons name="create-outline" size={23} color={theme.blueDark} />
          </Pressable>
        </View>

        {/* TITLE */}
        <View style={styles.titleArea}>
          <Text style={styles.title}>Messages</Text>
          <Text style={styles.subtitle}>
            Your conversations, all in one place.
          </Text>
        </View>

        {/* SEARCH */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={21} color={theme.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            placeholderTextColor={theme.muted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color={theme.muted} />
            </Pressable>
          )}
        </View>

        {/* FILTERS */}
        <View style={styles.filterRow}>
          {filters.map((item) => {
            const active = filter === item;

            return (
              <Pressable
                key={item}
                onPress={() => setFilter(item)}
                style={[
                  styles.filterButton,
                  active && styles.activeFilter,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    active && styles.activeFilterText,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* INBOX CARD */}
        <View style={styles.inboxCard}>
          <View style={styles.inboxHeader}>
            <View>
              <Text style={styles.sectionTitle}>Your inbox</Text>
              <Text style={styles.sectionSubtitle}>
                Stay connected with your people
              </Text>
            </View>

            <View style={styles.messageIcon}>
              <Ionicons
                name="chatbubbles"
                size={24}
                color={theme.blue}
              />
            </View>
          </View>

          <View style={styles.emptyArea}>
            <View style={styles.emptyCircle}>
              <View style={styles.emptyInnerCircle}>
                <Ionicons
                  name="chatbubble-ellipses"
                  size={43}
                  color={theme.blue}
                />
              </View>
            </View>

            <Text style={styles.emptyTitle}>Your inbox is waiting</Text>

            <Text style={styles.emptyText}>
              When you start conversations on BRITUME,
              your messages will appear here.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
              ]}
              onPress={startMessage}
            >
              <Ionicons
                name="add"
                size={21}
                color={theme.textLight}
              />
              <Text style={styles.primaryButtonText}>
                Start a conversation
              </Text>
            </Pressable>
          </View>
        </View>

        {/* FEATURES */}
        <Text style={styles.featuresHeading}>Connect your way</Text>

        <View style={styles.featureCard}>
          <View style={[styles.featureIcon, styles.blueIcon]}>
            <Ionicons name="chatbubble-outline" size={23} color={theme.blue} />
          </View>
          <View style={styles.featureInfo}>
            <Text style={styles.featureTitle}>Direct messages</Text>
            <Text style={styles.featureDescription}>
              Private conversations with friends.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.muted} />
        </View>

        <View style={styles.featureCard}>
          <View style={[styles.featureIcon, styles.purpleIcon]}>
            <Ionicons name="mic-outline" size={23} color={theme.purple} />
          </View>
          <View style={styles.featureInfo}>
            <Text style={styles.featureTitle}>Voice messages</Text>
            <Text style={styles.featureDescription}>
              Share your voice with the people you care about.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.muted} />
        </View>

        <View style={styles.featureCard}>
          <View style={[styles.featureIcon, styles.goldIcon]}>
            <Ionicons name="videocam-outline" size={23} color="#C28A00" />
          </View>
          <View style={styles.featureInfo}>
            <Text style={styles.featureTitle}>Audio and video calls</Text>
            <Text style={styles.featureDescription}>
              Get closer through live conversations.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.muted} />
        </View>

        <Text style={styles.footer}>
          BRITUME • Vortex of Possibilities
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 45,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: theme.clayBlue,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayRaised,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  logo: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: theme.blue,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayRaised,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
  },
  brandName: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  tagline: {
    color: theme.muted,
    fontSize: 9,
    marginTop: 2,
  },
  headerButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: theme.panel,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayRaised,
  },
  titleArea: {
    marginBottom: 20,
  },
  title: {
    color: theme.text,
    fontSize: 30,
    fontWeight: '900',
  },
  subtitle: {
    color: theme.muted,
    fontSize: 13,
    marginTop: 5,
  },
  searchBox: {
    height: 54,
    borderRadius: 18,
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 11,
    ...theme.clayRaised,
  },
  searchInput: {
    flex: 1,
    color: theme.text,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 11,
    marginTop: 20,
    marginBottom: 22,
  },
  filterButton: {
    paddingHorizontal: 23,
    paddingVertical: 11,
    borderRadius: 15,
    backgroundColor: theme.panel,
    ...theme.clayRaised,
  },
  activeFilter: {
    backgroundColor: theme.blue,
  },
  filterText: {
    color: theme.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  inboxCard: {
    backgroundColor: theme.panel,
    borderRadius: 27,
    padding: 19,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    ...theme.clayShadow,
  },
  inboxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: theme.text,
    fontSize: 19,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: theme.muted,
    fontSize: 11,
    marginTop: 5,
  },
  messageIcon: {
    width: 45,
    height: 45,
    borderRadius: 16,
    backgroundColor: theme.clayBlue,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayRaised,
  },
  emptyArea: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 20,
  },
  emptyCircle: {
    width: 125,
    height: 125,
    borderRadius: 63,
    backgroundColor: theme.clayBlue,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayShadow,
  },
  emptyInnerCircle: {
    width: 91,
    height: 91,
    borderRadius: 46,
    backgroundColor: theme.panel,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayRaised,
  },
  emptyTitle: {
    color: theme.text,
    fontSize: 19,
    fontWeight: '900',
    marginTop: 23,
  },
  emptyText: {
    color: theme.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 9,
    maxWidth: 255,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.blue,
    paddingHorizontal: 21,
    paddingVertical: 14,
    borderRadius: 17,
    marginTop: 23,
    ...theme.clayRaised,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
  featuresHeading: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 29,
    marginBottom: 15,
  },
  featureCard: {
    backgroundColor: theme.panel,
    borderRadius: 21,
    padding: 15,
    marginBottom: 13,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.glassBorder,
    ...theme.clayRaised,
  },
  featureIcon: {
    width: 49,
    height: 49,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
    ...theme.clayRaised,
  },
  blueIcon: {
    backgroundColor: theme.clayBlue,
  },
  purpleIcon: {
    backgroundColor: theme.clayPurple,
  },
  goldIcon: {
    backgroundColor: '#FFF5D5',
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '900',
  },
  featureDescription: {
    color: theme.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
    paddingRight: 5,
  },
  footer: {
    color: theme.muted,
    textAlign: 'center',
    fontSize: 10,
    marginTop: 23,
  },
});
