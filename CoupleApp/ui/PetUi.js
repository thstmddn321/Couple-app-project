import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, Alert } from 'react-native';
import axios from 'axios';

const PetUi = ({ route }) => {
  const { memberId } = route.params;
  const [equippedCarpet, setEquippedCarpet] = useState(null);
  const [equippedHouse, setEquippedHouse] = useState(null);
  const [shop, setShop] = useState([]);
  const [coins, setCoins] = useState(0);
  const [ownedItems, setOwnedItems] = useState([]);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = () => {
    loadPet();
    loadShop();
    loadCoins();
    loadInventory();
  };

  const loadPet = () => {
    axios.get(`http://localhost:3000/pet/${memberId}/status`)
      .then(res => {
        if (res.data.success) {
          setEquippedCarpet(res.data.equipped_carpet);
          setEquippedHouse(res.data.equipped_house);
        } else {
          setEquippedCarpet(null);
          setEquippedHouse(null);
        }
      });
  };

  const loadShop = () => {
    axios.get('http://localhost:3000/shop/items')
      .then(res => setShop(res.data.items));
  };

  const loadCoins = () => {
    axios.get(`http://localhost:3000/couple/${memberId}/status`)
      .then(res => {
        if (res.data.success) {
          setCoins(res.data.coins);
        }
      });
  };

  const loadInventory = () => {
    axios.get(`http://localhost:3000/pet/${memberId}/inventory`)
      .then(res => {
        if (res.data.success) {
          setOwnedItems(res.data.items);
        }
      });
  };

  const handleBuy = (itemId) => {
    axios.post('http://localhost:3000/shop/buy', { memberId, itemId })
      .then(res => {
        if (res.data.success) {
          Alert.alert("구매 성공!", res.data.applied + " 적용됨");
          loadAll();
        } else {
          Alert.alert("실패", res.data.message || "구매 실패");
        }
      });
  };

  const isOwned = (itemId) => ownedItems.includes(itemId);

  const getCarpetImage = (carpetName) => {
    switch (carpetName) {
      case '빨간 카펫':
        return require('../assets/red_carpet.png');
      default:
        return null;
    }
  };

  const getHouseImage = (houseName) => {
    switch (houseName) {
      case '애완동물집':
        return require('../assets/house.png');
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <View style={{ position: 'absolute', top: 40, right: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>💰 {coins} 코인</Text>
      </View>

      <Text style={{ fontSize: 24, margin: 10 }}>내 펫</Text>

      <View style={{ width: 300, height: 300, justifyContent: 'center', alignItems: 'center' }}>
        {equippedCarpet && (
          <Image source={getCarpetImage(equippedCarpet)} style={{ position: 'absolute', width: 250, height: 130, bottom: 70, zIndex: 0 }} />
        )}
        {equippedHouse && (
          <Image source={getHouseImage(equippedHouse)} style={{ position: 'absolute', width: 180, height: 180, top: 40, zIndex: 1 }} />
        )}
        <Image source={require('../assets/dog.png')} style={{ width: 100, height: 100, zIndex: 2 }} />
      </View>

      <Text style={{ fontSize: 20, marginTop: 20 }}>상점</Text>
      <FlatList
        data={shop}
        keyExtractor={item => item.item_id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => handleBuy(item.item_id)}
            disabled={isOwned(item.item_id)}
            style={{ opacity: isOwned(item.item_id) ? 0.3 : 1 }}
          >
            <Text style={{ fontSize: 18, margin: 10 }}>
              {item.item_name} - {item.price} 코인
              {isOwned(item.item_id) && ' (구매완료)'}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default PetUi;