import React, { useState } from 'react';
import {
Alert,
Pressable,
ScrollView,
StyleSheet,
Switch,
Text,
View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { theme } from '../../src/lib/theme';

type ProfileTab = 'Photos' | 'Create' | 'Hosts';

const profileTabs: ProfileTab[] = ['Photos', 'Create', 'Hosts'];

export default function ProfileScreen() {
const [activeTab, setActiveTab] = useState<ProfileTab>('Photos');
const [isPublic, setIsPublic] = useState(true);

const showMessage = (title: string, message: string) => {
Alert.alert(title, message);
};

return (
<ScrollView
style={styles.screen}
contentContainerStyle={styles.content}
showsVerticalScrollIndicator={false}
>
{/* Top bar */}
<View style={styles.topBar}>
<Text style={styles.pageTitle}>Profile</Text>
<Pressable
accessibilityLabel="Profile options"
style={styles.topButton}
onPress={() =>
showMessage('Profile options', 'Profile options will be available here.')
}
>
<Ionicons
name="ellipsis-horizontal"
size={23}
color={theme.text}
/>
</Pressable>
</View>

  {/* Avatar and profile information */}
  <View style={styles.profileHeader}>
    <View style={styles.avatarWrap}>
      <View style={styles.avatar}>
        <Ionicons
          name="image-outline"
          size={37}
          color={theme.cyan}
        />
      </View>

      <Pressable
        accessibilityLabel="Add profile photo"
        style={styles.addAvatarButton}
        onPress={() =>
          showMessage(
            'Profile photo',
            'Photo selection and uploading will be connected when media storage is ready.'
          )
        }
      >
        <Ionicons name="add" size={21} color="#FFFFFF" />
      </Pressable>
    </View>

    <Text style={styles.profileName}>Name</Text>
    <Text style={styles.bio}>
      Bio <Text style={styles.bioDot}>•</Text>
    </Text>
  </View>

  {/* Profile tabs */}
  <View style={styles.tabs}>
    {profileTabs.map((tab) => {
      const selected = activeTab === tab;

      return (
        <Pressable
          key={tab}
          onPress={() => setActiveTab(tab)}
          style={styles.tab}
          accessibilityRole="tab"
          accessibilityState={{ selected }}
        >
          <Text
            style={[
              styles.tabText,
              selected && styles.activeTabText,
            ]}
          >
            {tab}
          </Text>

          {selected && <View style={styles.tabUnderline} />}
        </Pressable>
      );
    })}
  </View>

  {/* Personal details */}
  <View style={styles.card}>
    <View style={styles.cardHeading}>
      <Text style={styles.cardTitle}>Personal details</Text>

      <Pressable
        accessibilityLabel="Edit personal details"
        hitSlop={8}
        onPress={() =>
          showMessage(
            'Personal details',
            'Editing profile details will be connected to your profile data.'
          )
        }
      >
        <Ionicons
          name="pencil-outline"
          size={20}
          color={theme.muted}
        />
      </Pressable>
    </View>

    <View style={styles.publicRow}>
      <View style={styles.publicInfo}>
        <Ionicons
          name="globe-outline"
          size={20}
          color={theme.cyan}
        />
        <Text style={styles.rowLabel}>Public</Text>
      </View>

      <Switch
        value={isPublic}
        onValueChange={setIsPublic}
        trackColor={{
          false: theme.border,
          true: theme.cyan,
        }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={theme.border}
      />
    </View>
  </View>

  {/* Subscribers */}
  <Pressable
    style={styles.card}
    onPress={() =>
      showMessage(
        'Subscribers',
        'Your subscriber list will appear here when profile data is connected.'
      )
    }
  >
    <View style={styles.singleCardRow}>
      <View style={styles.iconBubble}>
        <Ionicons
          name="people-outline"
          size={21}
          color={theme.cyan}
        />
      </View>

      <Text style={styles.cardTitle}>Subscribers</Text>

      <View style={styles.flexSpace} />

      <Ionicons
        name="chevron-forward"
        size={20}
        color={theme.muted}
      />
    </View>
  </Pressable>

  {/* Friends */}
  <Pressable
    style={styles.card}
    onPress={() =>
      showMessage(
        'Friends',
        'Your friends list will appear here when friend data is connected.'
      )
    }
  >
    <View style={styles.singleCardRow}>
      <View style={styles.iconBubble}>
        <Ionicons
          name="people-circle-outline"
          size={22}
          color={theme.cyan}
        />
      </View>

      <Text style={styles.cardTitle}>Friends</Text>

      <View style={styles.flexSpace} />

      <Text style={styles.seeAll}>See all</Text>

      <Ionicons
        name="chevron-forward"
        size={19}
        color={theme.muted}
      />
    </View>
  </Pressable>

  {/* My library */}
  <Text style={styles.libraryTitle}>My library</Text>

  <View style={styles.libraryRow}>
    {/* Photos */}
    <Pressable
      style={styles.libraryCard}
      onPress={() => {
        setActiveTab('Photos');
        showMessage(
          'Photos',
          'Your photo library will appear here when media storage is connected.'
        );
      }}
    >
      <View style={styles.libraryCardHeading}>
        <Text style={styles.libraryCardTitle}>Photos</Text>
        <Ionicons
          name="arrow-forward"
          size={15}
          color={theme.cyan}
        />
      </View>

      <View style={styles.photoGrid}>
        {Array.from({ length: 6 }, (_, index) => (
          <View key={index} style={styles.photoBox}>
            <Ionicons
              name="image-outline"
              size={13}
              color={theme.muted}
            />
          </View>
        ))}
      </View>

      <Text style={styles.enterText}>Enter</Text>
    </Pressable>

    {/* Dashboard */}
    <Pressable
      style={styles.libraryCard}
      onPress={() => router.push('/dashboard' as never)}
    >
      <View style={styles.libraryCardHeading}>
        <Text style={styles.libraryCardTitle}>Dashboard</Text>
        <Ionicons
          name="arrow-forward"
          size={15}
          color={theme.cyan}
        />
      </View>

      <View style={styles.dashboardGraphic}>
        <Ionicons
          name="trending-up-outline"
          size={43}
          color={theme.cyan}
        />
      </View>

      <Text style={styles.enterText}>Enter</Text>
    </Pressable>

    {/* Videos */}
    <Pressable
      style={styles.libraryCard}
      onPress={() => {
        setActiveTab('Create');
        showMessage(
          'Videos',
          'Your video library will appear here when media storage is connected.'
        );
      }}
    >
      <View style={styles.libraryCardHeading}>
        <Text style={styles.libraryCardTitle}>Videos</Text>
        <Ionicons
          name="arrow-forward"
          size={15}
          color={theme.cyan}
        />
      </View>

      <View style={styles.videoStack}>
        {[0, 1, 2].map((item) => (
          <View key={item} style={styles.videoItem}>
            <Ionicons
              name="play-circle-outline"
              size={17}
              color={theme.cyan}
            />
            <View style={styles.videoLine} />
          </View>
        ))}
      </View>

      <Text style={styles.enterText}>Enter</Text>
    </Pressable>
  </View>

  {/* Active tab content */}
  <View style={styles.tabContent}>
    <Text style={styles.tabContentTitle}>{activeTab}</Text>
    <Text style={styles.tabContentDescription}>
      {activeTab === 'Photos'
        ? 'Your photos will appear here.'
        : activeTab === 'Create'
          ? 'Your creations will appear here.'
          : 'Your hosts will appear here.'}
    </Text>
  </View>
</ScrollView>

);
}

const styles = StyleSheet.create({
screen: {
flex: 1,
backgroundColor: theme.bg,
},
content: {
paddingHorizontal: 15,
paddingTop: 12,
paddingBottom: 30,
},
topBar: {
minHeight: 43,
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
marginBottom: 8,
},
pageTitle: {
color: theme.text,
fontSize: 23,
fontWeight: '800',
},
topButton: {
width: 38,
height: 38,
alignItems: 'center',
justifyContent: 'center',
borderRadius: 19,
},
profileHeader: {
alignItems: 'center',
paddingTop: 7,
paddingBottom: 17,
},
avatarWrap: {
width: 100,
height: 100,
marginBottom: 8,
position: 'relative',
alignItems: 'center',
justifyContent: 'center',
},
avatar: {
width: 90,
height: 90,
borderRadius: 45,
backgroundColor: '#FFFFFF',
borderWidth: 2,
borderColor: theme.border,
alignItems: 'center',
justifyContent: 'center',
},
addAvatarButton: {
position: 'absolute',
right: 0,
bottom: 2,
width: 28,
height: 28,
borderRadius: 14,
backgroundColor: theme.cyan,
borderWidth: 2,
borderColor: theme.bg,
alignItems: 'center',
justifyContent: 'center',
},
profileName: {
color: theme.text,
fontSize: 21,
fontWeight: '800',
marginTop: 1,
},
bio: {
color: theme.muted,
fontSize: 14,
marginTop: 4,
},
bioDot: {
color: theme.cyan,
fontSize: 16,
},
tabs: {
flexDirection: 'row',
borderBottomWidth: 1,
borderBottomColor: theme.border,
marginBottom: 15,
},
tab: {
flex: 1,
minHeight: 43,
alignItems: 'center',
justifyContent: 'center',
position: 'relative',
},
tabText: {
color: theme.muted,
fontSize: 14,
fontWeight: '600',
},
activeTabText: {
color: theme.cyan,
fontWeight: '800',
},
tabUnderline: {
position: 'absolute',
bottom: -1,
height: 3,
width: '58%',
backgroundColor: theme.cyan,
borderRadius: 3,
},
card: {
backgroundColor: theme.panel,
borderWidth: 1,
borderColor: theme.border,
borderRadius: 17,
paddingHorizontal: 14,
paddingVertical: 13,
marginBottom: 11,
},
cardHeading: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
marginBottom: 12,
},
cardTitle: {
color: theme.text,
fontSize: 15,
fontWeight: '800',
},
publicRow: {
minHeight: 35,
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
},
publicInfo: {
flexDirection: 'row',
alignItems: 'center',
gap: 10,
},
rowLabel: {
color: theme.text,
fontSize: 14,
fontWeight: '600',
},
singleCardRow: {
minHeight: 33,
flexDirection: 'row',
alignItems: 'center',
gap: 10,
},
iconBubble: {
width: 34,
height: 34,
borderRadius: 12,
backgroundColor: theme.panel2,
alignItems: 'center',
justifyContent: 'center',
},
flexSpace: {
flex: 1,
},
seeAll: {
color: theme.cyan,
fontSize: 13,
fontWeight: '700',
},
libraryTitle: {
color: theme.text,
fontSize: 19,
fontWeight: '800',
marginTop: 9,
marginBottom: 11,
},
libraryRow: {
flexDirection: 'row',
alignItems: 'stretch',
gap: 8,
},
libraryCard: {
flex: 1,
minWidth: 0,
backgroundColor: theme.panel,
borderWidth: 1,
borderColor: theme.border,
borderRadius: 15,
padding: 8,
minHeight: 145,
},
libraryCardHeading: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
gap: 2,
marginBottom: 11,
},
libraryCardTitle: {
flexShrink: 1,
color: theme.text,
fontSize: 11,
fontWeight: '800',
},
photoGrid: {
flexDirection: 'row',
flexWrap: 'wrap',
gap: 4,
},
photoBox: {
width: '47%',
aspectRatio: 1,
backgroundColor: theme.panel2,
borderRadius: 5,
alignItems: 'center',
justifyContent: 'center',
},
dashboardGraphic: {
height: 69,
backgroundColor: theme.panel2,
borderRadius: 9,
alignItems: 'center',
justifyContent: 'center',
},
videoStack: {
gap: 6,
paddingTop: 2,
},
videoItem: {
height: 18,
flexDirection: 'row',
alignItems: 'center',
gap: 4,
paddingHorizontal: 4,
backgroundColor: theme.panel2,
borderRadius: 5,
},
videoLine: {
flex: 1,
height: 3,
borderRadius: 2,
backgroundColor: theme.border,
},
enterText: {
color: theme.cyan,
fontSize: 11,
fontWeight: '700',
textAlign: 'center',
marginTop: 8,
},
tabContent: {
marginTop: 17,
padding: 14,
borderRadius: 15,
backgroundColor: theme.panel,
borderWidth: 1,
borderColor: theme.border,
},
tabContentTitle: {
color: theme.text,
fontSize: 15,
fontWeight: '800',
},
tabContentDescription: {
color: theme.muted,
fontSize: 13,
marginTop: 5,
},
});
