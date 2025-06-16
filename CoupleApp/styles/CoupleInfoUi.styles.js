import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  topBox: {
    width: '100%',
    height: '40%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 15,
    backgroundColor: '#FFE4E9',  
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },

  dateText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#FF6B81', 
  },

  daysText: {
    fontSize: 20,
    color: '#333',
  },

  registerButton: {
    marginTop: 20,
    backgroundColor: '#FF6B81', 
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5,
  },

  registerText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },

  bottomBox: {
    width: '100%',
    height: '20%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EAF4FF',  
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },

  meetCountText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#333',
  },
});