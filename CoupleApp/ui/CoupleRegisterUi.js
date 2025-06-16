import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Button, Alert, TextInput } from 'react-native';
import styles from "../styles/CoupleRegisterUi.styles";
import axios from 'axios';
import { UserContext } from '../contexts/Usercontext';  
import dayjs from "dayjs";

const CoupleRegisterUi = ({ navigation }) => {

   
    const { user } = useContext(UserContext);
    const maleId = user.memberId; 

    
    const [femaleId, setFemaleId] = useState('');

    const insertCouple = (maleId, femaleId, coupleDate) => {
        axios.post('http://localhost:3000/couple/insert', {
            maleId: maleId,
            femaleId: femaleId,
            coupleDate: coupleDate  
        })
        .then(response => {
            if (response.data.success) {
                console.log("커플 등록 성공!", response.data);
                Alert.alert("등록 완료!");
                navigation.navigate("CoupleInfo");
            } else {
                console.log("커플 등록 실패", response.data.message);
                Alert.alert("등록 실패", response.data.message);
            }
        })
        .catch(error => {
            console.error("서버 통신 에러", error);
            Alert.alert("서버 오류", "등록에 실패했습니다.");
        });
    };

    const pressRegisterButton = () => {
        if (!femaleId) {
            Alert.alert("상대방 UID를 입력하세요.");
            return;
        }

        insertCouple(maleId, femaleId, null);
    };

    return (
        <View style={styles.container}>
            {/* 내 UID 표시 */}
            <Text style={styles.myUidText}>나의 UID : {maleId}</Text>

            <TextInput 
                style={styles.input} 
                placeholder='상대방 UID'
                value={femaleId}
                onChangeText={setFemaleId}
                keyboardType='numeric'
            />
            <Button style={styles.btn} title="등록" onPress={pressRegisterButton} />
        </View>
    );
};

export default CoupleRegisterUi;