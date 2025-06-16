import { useState } from "react";
import { Button, TextInput, View, Alert } from "react-native";
import LoginUiStyles from "../styles/LoginUi.styles";
import axios from 'axios';
import { useContext } from 'react';
import { UserContext } from '../contexts/Usercontext';  


const LoginUi = ({ navigation }) => {
    const [ID, setID] = useState('')
    const [PW, setPW] = useState('')
    const { setUser } = useContext(UserContext);
    const pressRegisterButton = () => {
        setID("")
        setPW('')
        navigation.navigate("Register")
    }

    const pressLoginButton = () => {
    axios.post('http://localhost:3000/login', {
        email: ID,
        password: PW,
    })
    .then(response => {
        console.log("서버 응답:", response.data);
        if (response.data.success === true) {
        
            setUser({ memberId: response.data.memberId});
            navigation.navigate("Main");
        } else {
           
            Alert.alert("로그인 실패", response.data.message || "이메일 또는 비밀번호가 틀렸습니다.");
        }
    })
    .catch(error => {
        if (error.response) {
            console.log("서버 에러:", error.response.data);
        } else if (error.request) {
            console.log("응답 없음:", error.request);
        } else {
            console.log("에러 발생:", error.message);
        }
        Alert.alert("서버 연결 실패");
    });
}

    return (
        <View style={LoginUiStyles.container}>
            <TextInput
                style={LoginUiStyles.input}
                value={ID}
                placeholder="email"
                onChangeText={setID}
            />
            <TextInput
                style={LoginUiStyles.input}
                value={PW}
                placeholder="pw"
                onChangeText={setPW}
                secureTextEntry={true}
            />
            
            <Button title="Log In" onPress={pressLoginButton} />
            <Button title="Sign Up" onPress={pressRegisterButton} />
        </View> 
    ) 
}

export default LoginUi;