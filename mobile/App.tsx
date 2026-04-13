import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, BackHandler, FlatList, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { create } from 'zustand';

// Import data.json
import data from './data.json';

// --- Zustand Store ---
const useStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  cart: {},
  addToCart: (productId) => set((state) => ({ cart: { ...state.cart, [productId]: (state.cart[productId] || 0) + 1 } })),
  removeFromCart: (productId) => set((state) => {
    const newCart = { ...state.cart };
    if (newCart[productId] > 1) {
      newCart[productId] -= 1;
    } else {
      delete newCart[productId];
    }
    return { cart: newCart };
  }),
  clearCart: () => set({ cart: {} }),
}));

// --- Nav ---
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- Catalog Screen ---
function CatalogScreen() {
  const addToCart = useStore((state) => state.addToCart);
  const removeFromCart = useStore((state) => state.removeFromCart);
  const cart = useStore((state) => state.cart);

  return (
    <View style={styles.container}>
      <FlatList 
        data={data.products}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productDesc}>{item.company} • ₹{item.price}</Text>
            </View>
            <View style={styles.cartControls}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.id)}>
                <Text style={styles.qtyBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyText}>{cart[item.id] || 0}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(item.id)}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

// --- Cart Screen ---
function CartScreen() {
  const cart = useStore((state) => state.cart);
  const clearCart = useStore((state) => state.clearCart);
  const [showQR, setShowQR] = useState(false);

  const cartItems = Object.keys(cart).map(id => {
    const product = data.products.find(p => p.id === parseInt(id));
    return { ...product, quantity: cart[id] };
  });

  const totalValue = cartItems.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);
  const isDisabled = totalValue < 2000;

  const handlePlaceOrder = () => {
    Alert.alert("Success", "Order Placed. 60-Day Credit Period Started.");
    setShowQR(true);
  };

  return (
    <View style={styles.container}>
      {cartItems.length === 0 ? (
        <Text style={styles.subtitle}>Your cart is empty.</Text>
      ) : (
        <FlatList 
          data={cartItems}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <Text style={styles.productName}>{item.name} x {item.quantity}</Text>
              <Text style={styles.productDesc}>₹{item.price * item.quantity}</Text>
            </View>
          )}
        />
      )}
      
      <View style={styles.checkoutFooter}>
        <Text style={styles.totalText}>Total Value: ₹{totalValue}</Text>
        
        {isDisabled && totalValue > 0 && (
          <Text style={styles.minOrderAlert}>Minimum order: ₹2000</Text>
        )}
        
        <TouchableOpacity 
          style={[styles.placeOrderBtn, isDisabled && styles.placeOrderBtnDisabled]} 
          disabled={isDisabled} 
          onPress={handlePlaceOrder}
        >
          <Text style={styles.buttonText}>Place Order</Text>
        </TouchableOpacity>

        {showQR && (
          <View style={styles.qrContainer}>
            <Image 
              source={{uri: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PharmaDummyPayment'}} 
              style={{width: 150, height: 150, marginTop: 20}} 
            />
            <Text style={styles.qrText}>Scan for Manual Payment</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// --- MainTabs Screen ---
function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Catalog" component={CatalogScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
    </Tab.Navigator>
  );
}

// --- Pending Approval Screen ---
function PendingApprovalScreen({ navigation }) {
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => true; 
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pending Approval</Text>
      <Text style={styles.errorText}>Account Under Review. Please wait for admin approval.</Text>
    </View>
  );
}

// --- Login Screen ---
function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const setUser = useStore((state) => state.setUser);

  const handleLogin = () => {
    const foundUser = data.users.find(u => u.phone === phone);

    if (!foundUser) {
      Alert.alert('Error', 'Unregistered User');
      return;
    }

    setUser(foundUser);

    if (foundUser.phone === '8888888888' || foundUser.is_approved === false) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'PendingApproval' }],
      });
    } else if (foundUser.phone === '9999999999' || foundUser.is_approved === true) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>B2B Gatekeeper</Text>
      <Text style={styles.subtitle}>Enter your registered phone number</Text>
      
      <TextInput
        style={styles.input}
        placeholder="10-digit phone number"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        maxLength={10}
      />
      
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

// --- App Root ---
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen 
          name="PendingApproval" 
          component={PendingApprovalScreen} 
          options={{ 
            headerShown: true, 
            title: 'Under Review',
            headerBackVisible: false, 
            gestureEnabled: false 
          }} 
        />
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabs} 
          options={{ 
            headerShown: false,
            gestureEnabled: false
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0f172a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  productCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  productDesc: {
    fontSize: 14,
    color: '#64748b',
  },
  cartControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyBtn: {
    backgroundColor: '#e2e8f0',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'center',
  },
  checkoutFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  totalText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'right',
  },
  minOrderAlert: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 12,
  },
  placeOrderBtn: {
    backgroundColor: '#10b981', // green default
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  placeOrderBtnDisabled: {
    backgroundColor: '#cbd5e1', // gray disabled
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  qrText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
  }
});
