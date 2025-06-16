import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList } from 'react-native';
import axios from 'axios';
import { UserContext } from '../contexts/Usercontext';
import styles from '../styles/BadgeUi.styles';  

const badgeList = [
  { id: 1, name: "첫 만남", desc: "최초 방문 기록", check: (stats) => stats.hasFirstVisit },
  { id: 2, name: "10일 기념", desc: "연애 10일 돌파", check: (stats) => stats.daysTogether >= 10 },
  { id: 3, name: "100km 클럽", desc: "함께 이동 100km 돌파", check: (stats) => stats.totalDistance >= 100000 },
  { id: 4, name: "10회 만남", desc: "이번달 10회 만남", check: (stats) => stats.monthlyMeetingCount >= 10 },
  { id: 5, name: "500분 동행", desc: "총 500분 이상 함께", check: (stats) => stats.togetherTimeMinutes >= 500 }
];

const BadgeUi = () => {
  const { user } = useContext(UserContext);
  const [stats, setStats] = useState({});

  useEffect(() => {
    axios.get(`http://localhost:3000/couple/${user.memberId}/badges`)
      .then(res => setStats(res.data))
      .catch(err => console.log(err));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏅 나의 뱃지</Text>
      <FlatList
        data={badgeList}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => {
          const achieved = item.check(stats);
          return (
            <View style={[styles.badgeCard, achieved ? styles.achieved : styles.locked]}>
              <Text style={styles.badgeName}>{item.name}</Text>
              <Text style={styles.badgeDesc}>{item.desc}</Text>
              <Text style={styles.status}>{achieved ? '획득 완료 ✅' : '아직 잠금 🔒'}</Text>
            </View>
          );
        }}
      />
    </View>
  );
};

export default BadgeUi;