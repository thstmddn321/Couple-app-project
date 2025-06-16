import React from 'react';
import { UserProvider } from './contexts/Usercontext';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginUi from './ui/LoginUi';
import MainUi from './ui/MainUi';
import RegisterUi from './ui/RegisterUi';
import CoupleInfoUi from './ui/CoupleInfoUi';
import CoupleRegisterUi from './ui/CoupleRegisterUi';
import PetUi from './ui/PetUi';
import BadgeUi from './ui/BadgeUi';
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <UserProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginUi} />
          <Stack.Screen name="Main" component={MainUi} />
          <Stack.Screen name="Register" component={RegisterUi} />
          <Stack.Screen name="CoupleInfo" component={CoupleInfoUi} />
          <Stack.Screen name="CoupleRegister" component={CoupleRegisterUi} />
          <Stack.Screen name="Pet" component={PetUi} />
          <Stack.Screen name="Badge" component={BadgeUi} />
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}