import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Button, Alert, Platform } from 'react-native';
import styles from "../styles/CoupleInfoUi.styles";
import dayjs from "dayjs";
import axios from 'axios';
import { UserContext } from '../contexts/Usercontext';
import DateTimePicker from '@react-native-community/datetimepicker';

const CoupleInfoUi = ({ navigation }) => {
  const { user } = useContext(UserContext);
  const [coupleDate, setCoupleDate] = useState(null);
  const [meetingCount, setMeetingCount] = useState(0);
  const [togetherTime, setTogetherTime] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [isCouple, setIsCouple] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [mode, setMode] = useState("insert");
  const today = dayjs();

  useEffect(() => {
    if (!user || !user.memberId) return;

    axios.get(`http://localhost:3000/couple/${user.memberId}`)
      .then(response => {
        if (response.data.success) {
          setIsCouple(true);
          setCoupleDate(response.data.coupleDate);
          setMeetingCount(response.data.meetingCount);
        } else {
          setIsCouple(false);
        }
      })
      .catch(() => {
        setIsCouple(false);
        Alert.alert("서버 에러", "커플 정보를 불러오지 못했습니다.");
      });

    axios.get(`http://localhost:3000/couple/${user.memberId}/status`)
      .then(res => {
        if (res.data.success) {
          setTotalDistance(res.data.totalDistance); 
          setTogetherTime(res.data.togetherTime ?? 0);
        }
      });

  }, [user]);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (event.type === "dismissed" || !selectedDate) return;
    const formattedDate = dayjs(selectedDate).format("YYYY-MM-DD");
    if (mode === "insert") insertCoupleDate(formattedDate);
    else updateCoupleDate(formattedDate);
  };

  const insertCoupleDate = (selectedDate) => {
    axios.post('http://localhost:3000/couple/insertDate', {
      memberId: user.memberId,
      coupleDate: selectedDate
    })
    .then(response => {
      if (response.data.success) {
        Alert.alert("등록 완료!");
        setCoupleDate(selectedDate);
        setIsCouple(true);
      } else {
        Alert.alert("등록 실패", response.data.message);
      }
    })
    .catch(() => Alert.alert("서버 오류", "등록 실패"));
  };

  const updateCoupleDate = (selectedDate) => {
    axios.post('http://localhost:3000/couple/updateDate', {
      memberId: user.memberId,
      coupleDate: selectedDate
    })
    .then(response => {
      if (response.data.success) {
        Alert.alert("수정 완료!");
        setCoupleDate(selectedDate);
      } else {
        Alert.alert("수정 실패", response.data.message);
      }
    })
    .catch(() => Alert.alert("서버 오류", "수정 실패"));
  };

  const openDatePicker = (currentMode) => {
    setMode(currentMode);
    setShowDatePicker(true);
  };

  const daysTogether = coupleDate ? today.diff(dayjs(coupleDate), 'day') : 0;

  return (
    <View style={styles.container}>
      <View style={styles.topBox}>
        {isCouple ? (
          <>
            {coupleDate ? (
              <>
                <Text style={styles.dateText}>사귄 날짜: {dayjs(coupleDate).format('YYYY.MM.DD')}</Text>
                <Text style={styles.daysText}>오늘로 {daysTogether}일째 💕</Text>
                <Button title="사귄 날짜 수정하기" onPress={() => openDatePicker("update")} />
              </>
            ) : (
              <>
                <Text style={styles.daysText}>사귄 날짜를 아직 등록하지 않았어요 🥲</Text>
                <Button title="사귄 날짜 등록하기" onPress={() => openDatePicker("insert")} />
              </>
            )}
          </>
        ) : (
          <>
            <Text style={styles.daysText}>아직 커플이 등록되지 않았어요 🥲</Text>
            <TouchableOpacity style={styles.registerButton}>
              <Button title="커플 등록하기" onPress={() => navigation.navigate("CoupleRegister")} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {isCouple && coupleDate && (
        <View style={styles.bottomBox}>
          <Text style={styles.meetCountText}>이번 달에 {meetingCount}번 만났어요 📅</Text>
          <Text style={styles.meetCountText}>함께 있던 시간: {togetherTime}분 ⏱️</Text>
          <Text style={styles.meetCountText}>함께 이동한 거리: {(totalDistance / 1000).toFixed(1)} km 🚶‍♂️</Text>
        </View>
      )}

      {showDatePicker && (
        <DateTimePicker
          value={coupleDate ? new Date(coupleDate) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
};

export default CoupleInfoUi;