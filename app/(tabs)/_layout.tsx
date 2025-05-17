// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';  // ← make sure this path is correct

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        // remove headerShown and use your Header component instead
        header: () => <Header />,
        tabBarActiveTintColor: '#0066cc',
      }}
    >
      <Tabs.Screen
        name="allcases"
        options={{
          title: 'All Cases',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="assigned"
        options={{
          title: 'Assigned',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-done-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="navigate-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
