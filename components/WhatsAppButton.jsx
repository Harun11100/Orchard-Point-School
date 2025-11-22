// WhatsAppButton.js
import React from 'react';
import { TouchableOpacity, Alert, Linking, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome'; // ensure installed

export default function WhatsAppButton({ phone, productName }) {
  const handleWhatsApp = () => {
    const phoneNumber = phone || "+8801827699527";
    const message = `হ্যালো, আমি এই পণ্য সম্পর্কে আরও জানতে চাই: ${productName}`;
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert("ত্রুটি", "WhatsApp খোলা যায়নি।");
    });
  };

  return (
    <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp}>
      <Icon name="whatsapp" size={24} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  whatsappBtn: {
    backgroundColor: "#25D366",
    padding: 10,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    shadowColor: "#25D366",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
});
