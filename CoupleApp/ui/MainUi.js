import React, { useContext, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Switch } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { UserContext } from '../contexts/Usercontext';
import * as Location from 'expo-location';
import axios from 'axios';

const MainUi = ({ navigation }) => {
  const { user } = useContext(UserContext);
  const [location, setLocation] = useState(null);
  const [partnerLocation, setPartnerLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(true);
  const mapRef = useRef(null);
  let locationInterval = useRef(null);
  let partnerInterval = useRef(null);

  useEffect(() => {
    if (!user?.memberId) return;


    axios.get(`http://localhost:3000/member/${user.memberId}/sharing`)
      .then(res => {
        if (res.data.success) setSharing(res.data.sharing);
      })
      .catch(err => console.error("Sharing 불러오기 실패", err));

    startLocationTracking();

    axios.get(`http://localhost:3000/couple/${user.memberId}`)
      .then(res => {
        if (res.data.success) {
          startPartnerTracking();
        } else {
          console.log("커플 미등록 상태 → 파트너 추적 비활성");
        }
      })
      .catch(err => console.error("커플 등록 확인 실패", err));

    return () => {
      if (locationInterval.current) clearInterval(locationInterval.current);
      if (partnerInterval.current) clearInterval(partnerInterval.current);
    };
  }, [user]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ marginRight: 10, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ marginRight: 5, fontSize: 14 }}>위치공유</Text>
          <Switch value={sharing} onValueChange={toggleSharing} />
        </View>
      ),
    });
  }, [sharing]);

  const startLocationTracking = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('위치 권한이 필요합니다.');
      setLoading(false);
      return;
    }

    let initialLoc = await Location.getCurrentPositionAsync({});
    const initialRegion = {
      latitude: initialLoc.coords.latitude,
      longitude: initialLoc.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    setLocation(initialRegion);
    setLoading(false);

    locationInterval.current = setInterval(async () => {
      const position = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setLocation(coords);
      animateMap(coords);
      if (sharing) sendLocationToServer(coords);
    }, 10000);
  };

  const startPartnerTracking = () => {
    partnerInterval.current = setInterval(() => {
      axios.get(`http://localhost:3000/couple/${user.memberId}/partner`)
        .then(res => {
          if (res.data.success && res.data.visible && res.data.location) {
            setPartnerLocation({
              latitude: res.data.location.latitude,
              longitude: res.data.location.longitude
            });
          } else {
            setPartnerLocation(null); 
          }
        })
        .catch(err => console.error("Partner 위치 불러오기 실패", err));
    }, 10000);
  };

  const animateMap = (coords) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(coords, 1000);
    }
  };

  const sendLocationToServer = (coords) => {
    if (!user?.memberId) return;

    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ');

    axios.post('http://localhost:3000/location/update', {
      memberId: user.memberId,
      latitude: coords.latitude,
      longitude: coords.longitude,
      timestamp: timestamp
    }).catch(err => console.error("서버 전송 실패:", err));
  };

  const toggleSharing = async (value) => {
    setSharing(value);
    await axios.post(`http://localhost:3000/member/${user.memberId}/sharing`, { sharing: value });
  };

  const pressCoupleButton = () => navigation.navigate("CoupleInfo");
  const pressPetButton = () => navigation.navigate("Pet", { memberId: user.memberId });
  const pressBadgeButton = () => navigation.navigate("Badge");

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B81" />
        <Text>현재 위치를 불러오는 중입니다...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView ref={mapRef} style={styles.map} initialRegion={location}>
        {location && (
          <Marker coordinate={location} title="내 위치" pinColor="blue" />
        )}
        {partnerLocation && (
          <Marker coordinate={partnerLocation} title="상대방 위치" pinColor="red" />
        )}
      </MapView>

      <View style={styles.stickyBlock}>
        <StickyButton label="뱃지" onPress={pressBadgeButton} />
      </View>

      <View style={styles.stickyMenu}>
        <TabButton label="커플 정보" onPress={pressCoupleButton} />
        <TabButton label="펫" onPress={pressPetButton} />
      </View>
    </View>
  );
};

// 버튼 컴포넌트 그대로 유지
const StickyButton = ({ label, onPress }) => (
  <TouchableOpacity style={styles.stickyButton} onPress={onPress}>
    <Text style={styles.buttonText}>{label}</Text>
  </TouchableOpacity>
);

const TabButton = ({ label, onPress }) => (
  <TouchableOpacity style={styles.stickyTab} onPress={onPress}>
    <Text style={styles.tabText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  stickyBlock: {
    position: 'absolute',
    top: 100,
    right: 20,
    flexDirection: 'column',
    gap: 10,
  },
  stickyButton: {
    backgroundColor: '#FF6B81',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  stickyMenu: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stickyTab: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF6B81',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: { fontSize: 16, color: '#FF6B81', fontWeight: '500' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default MainUi;