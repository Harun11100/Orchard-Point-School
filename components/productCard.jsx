import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import WhatsAppButton from './WhatsAppButton';

export default function ProductCard({ product }) {

  const handleBuy = () => {
    if (product.link) {
      Linking.openURL(product.link).catch(() => {
        Alert.alert('ত্রুটি', 'লিংক খোলা যায়নি।');
      });
    } else {
      Alert.alert('লিংক নেই', 'পণ্যের লিংক উপলব্ধ নয়।');
    }
  };

  return (
    <View style={styles.card}>
      {/* Image Section */}
      <View style={styles.imageWrapper}>
        <Image source={{ uri: product.image }} style={styles.image} />

        {/* Discount Badge */}
        {product.discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{product.discount} TK OFF</Text>
          </View>
        )}

        {/* Slogan Badge */}
        {product.title && (
          <View style={styles.sloganBadge}>
            <Text style={styles.sloganText}>🔥 {product.title}</Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.info}>
        <Text style={styles.title}>{product.name}</Text>
        <Text style={styles.price}>৳ {product.price}</Text>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.buyBtn} onPress={handleBuy}>
            <Text style={styles.buyText}>বিস্তারিত দেখুন</Text>
          </TouchableOpacity>

          {/* WhatsApp Icon */}
          <WhatsAppButton phone={product.whatsapp} productName={product.name} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  imageWrapper: {
    width: "100%",
    height: 220,
    position: 'relative',
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  discountBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#EF4444",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    elevation: 5,
  },
  discountText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  sloganBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    backgroundColor: "#fff",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FF5722",
    elevation: 5,
  },
  sloganText: {
    fontWeight: "600",
    fontSize: 13,
    color: "#222",
  },
  info: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3B82F6",
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  buyBtn: {
    flex: 1,
    backgroundColor: "#4F46E5",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    marginRight:5,
    elevation: 5,
  },
  buyText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
