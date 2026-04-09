import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen  from '../screens/DashboardScreen';
import BagsScreen       from '../screens/BagsScreen';
import CreateBagScreen  from '../screens/CreateBagScreen';
import OrdersScreen     from '../screens/OrdersScreen';
import ProfileScreen    from '../screens/ProfileScreen';

const Tab   = createBottomTabNavigator();
const BagStack = createNativeStackNavigator();

function BagsStackNavigator() {
  return (
    <BagStack.Navigator screenOptions={{ headerShown: false }}>
      <BagStack.Screen name="BagsList"  component={BagsScreen} />
      <BagStack.Screen name="CreateBag" component={CreateBagScreen} />
    </BagStack.Navigator>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: '#2E7D32', tabBarLabelStyle: { fontWeight: '600' } }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Bags"      component={BagsStackNavigator} />
      <Tab.Screen name="Orders"    component={OrdersScreen} />
      <Tab.Screen name="Profile"   component={ProfileScreen} />
    </Tab.Navigator>
  );
}
