import { useState } from "react";
import { Button, TextInput, Alert, View, StyleSheet, Text, TouchableOpacity } from "react-native";
import LoginUiStyles from "../styles/LoginUi.styles";
import axios from 'axios';


const RadioButton = ({ label, selected, onPress }) => {
    return (
        <TouchableOpacity
            style={[styles.radioButton, selected && styles.radioSelected]}
            onPress={onPress}
        >
            <Text style={[styles.radioText, selected && styles.radioTextSelected]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
};

const RegisterUi = ({ navigation }) => {
    const [ID, setID] = useState('');
    const [PW, setPW] = useState('');
    const [confirmPW, setConfirmPW] = useState('');
    const [name, setName] = useState('');
    const [sex, setSex] = useState('');

    

const pressRegisterButton = () => {
    if (PW !== confirmPW) {
        Alert.alert("비밀번호가 일치하지 않습니다.");
        return;
    }

    if (!ID || !PW || !name || !sex) {
        Alert.alert("모든 필드를 입력해주세요.");
        return;
    }

    axios.post('http://localhost:3000/register', {
    email: ID,
    password: PW,
    name: name,
    sex: sex
})
    .then(response => {
        console.log("회원가입 성공:", response.data);
        Alert.alert("회원가입 되었습니다!");
        navigation.goBack();
    })
    .catch(error => {
        if (error.response) {
            console.log("서버 에러:", error.response.data);
            Alert.alert("회원가입 실패: " + error.response.data.message);
        } else if (error.request) {
            console.log("응답 없음:", error.request);
            Alert.alert("서버 응답이 없습니다.");
        } else {
            console.log("에러 발생:", error.message);
            Alert.alert("에러 발생: " + error.message);
        }
    });
};

    return (
        <View style={LoginUiStyles.container}>

            <TextInput
                style={LoginUiStyles.input}
                value={ID}
                placeholder="Email"
                onChangeText={setID}
                autoCapitalize="none"
            />

            <TextInput
                style={LoginUiStyles.input}
                value={PW}
                placeholder="Password"
                onChangeText={setPW}

            />

            <TextInput
                style={LoginUiStyles.input}
                value={confirmPW}
                placeholder="Confirm Password"
                onChangeText={setConfirmPW}

            />

            <TextInput
                style={LoginUiStyles.input}
                value={name}
                placeholder="Name"
                onChangeText={setName}
            />

            <Text style={styles.label}>성별</Text>

            <View style={styles.radioContainer}>
                <RadioButton label="남자" selected={sex === 'male'} onPress={() => setSex('male')} />
                <RadioButton label="여자" selected={sex === 'female'} onPress={() => setSex('female')} />
            </View>

            <View style={styles.buttonWrapper}>
                <Button title="회원가입" onPress={pressRegisterButton} />
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    label: {
        marginTop: 16,
        marginBottom: 8,
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    radioContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 24,
    },
    radioButton: {
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderWidth: 1,
        borderColor: '#aaa',
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    radioSelected: {
        backgroundColor: '#007bff',
        borderColor: '#007bff',
    },
    radioText: {
        color: '#333',
        fontSize: 16,
    },
    radioTextSelected: {
        color: '#fff',
        fontWeight: 'bold',
    },
    buttonWrapper: {
        marginTop: 10,
    },
});

export default RegisterUi;