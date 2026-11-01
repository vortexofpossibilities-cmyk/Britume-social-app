
import React, { ReactNode } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const C = {
  bg: '#F2F8FF',
  white: '#FFFFFF',
  panel: '#E4F1FF',
  blue: '#168BFF',
  deepBlue: '#0756B5',
  purple: '#8C83FF',
  border: '#D3E6F8',
  text: '#19334D',
  muted: '#66829B',
};

type ClayCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  radius?: number;
};

export function ClayCard({
  children,
  style,
  padding = 16,
  radius = 26,
}: ClayCardProps) {
  return (
    <View
      style={[
        styles.cardShadow,
        { borderRadius: radius },
        style,
      ]}
    >
      <View
        style={[
          styles.card,
          {
            padding,
            borderRadius: radius,
          },
        ]}
      >
        <View style={styles.cardHighlight} />
        {children}
      </View>
    </View>
  );
}

type ClayButtonProps = {
  title: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export function ClayButton({
  title,
  onPress,
  icon,
  color = C.blue,
  style,
}: ClayButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.buttonShadow,
        {
          backgroundColor: color,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
        style,
      ]}
    >
      <View style={styles.buttonInner}>
        {icon && (
          <Ionicons
            name={icon}
            size={21}
            color={C.white}
          />
        )}
        <Text style={styles.buttonText}>{title}</Text>
      </View>
    </Pressable>
  );
}

type ClayIconProps = {
  name: React.ComponentProps<typeof Ionicons>['name'];
  size?: number;
  color?: string;
};

export function ClayIcon({
  name,
  size = 25,
  color = C.blue,
}: ClayIconProps) {
  return (
    <View style={styles.iconShadow}>
      <View style={styles.iconInner}>
        <Ionicons name={name} size={size} color={color} />
      </View>
    </View>
  );
}

// BRITUME 3D brand logo

export function ClayLogo({ size = 76 }: { size?: number }) {
  return (
    <View
      style={[
        styles.logoShadow,
        {
          width: size,
          height: size,
          borderRadius: size * 0.29,
        },
      ]}
    >
      <View
        style={[
          styles.logoInner,
          {
            borderRadius: size * 0.29,
          },
        ]}
      >
        <Text style={[styles.logoB, { fontSize: size * 0.72 }]}>
          B
        </Text>

        <View
          style={[
            styles.logoOrbit,
            {
              width: size * 1.02,
              height: size * 0.28,
              borderRadius: size,
              borderWidth: Math.max(2, size * 0.045),
              transform: [{ rotate: '-25deg' }],
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.white,
    shadowColor: '#548BCB',
    shadowOffset: { width: 8, height: 10 },
    shadowOpacity: 0.30,
    shadowRadius: 15,
    elevation: 12,
  },

  card: {
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },

  cardHighlight: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    opacity: 0.95,
  },

  buttonShadow: {
    minHeight: 52,
    paddingHorizontal: 20,
    borderRadius: 22,
    justifyContent: 'center',
    shadowColor: '#0756B5',
    shadowOffset: { width: 5, height: 7 },
    shadowOpacity: 0.42,
    shadowRadius: 9,
    elevation: 10,
  },

  buttonInner: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 20,
    borderTopWidth: 2,
    borderTopColor: '#85CCFF',
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
  },

  iconShadow: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: C.panel,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#548BCB',
    shadowOffset: { width: 5, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 9,
    elevation: 8,
  },

  iconInner: {
    width: 49,
    height: 49,
    borderRadius: 17,
    backgroundColor: '#F5FAFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },

  logoShadow: {
    backgroundColor: C.blue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0064E8',
    shadowOffset: { width: 6, height: 9 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 16,
  },

  logoInner: {
    width: '92%',
    height: '92%',
    backgroundColor: '#168BFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderTopColor: '#A8DEFF',
    borderLeftColor: '#70C2FF',
    borderRightColor: '#0867D5',
    borderBottomColor: '#0756B5',
    overflow: 'visible',
  },

  logoB: {
    color: '#FFFFFF',
    fontWeight: '900',
    textShadowColor: '#064A9C',
    textShadowOffset: { width: 3, height: 5 },
    textShadowRadius: 5,
  },

  logoOrbit: {
    position: 'absolute',
    borderColor: '#B9EDFF',
    backgroundColor: 'transparent',
  },
});
