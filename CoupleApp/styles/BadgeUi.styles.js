import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 20
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333'
  },
  badgeCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  badgeName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333'
  },
  badgeDesc: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10
  },
  status: {
    fontSize: 16,
    fontWeight: '600'
  },
  achieved: {
    borderColor: '#9CD778', 
    borderWidth: 2
  },
  locked: {
    borderColor: '#DDD',
    borderWidth: 1
  }
});