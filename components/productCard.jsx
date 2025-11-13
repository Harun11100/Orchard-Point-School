import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Linking, Alert, Platform } from 'react-native';

export default function ProductCard({ product }) {
  const handleBuy = () => {
    if (product.link) {
      Linking.openURL(product.link).catch(() => {
        Alert.alert('Error', 'Unable to open this link.');
      });
    } else {
      Alert.alert('No link', 'Product link not available.');
    }
  };

  return (
    <View style={styles.card}>
      {/* Product Image */}
      <Image source={{ uri: product.image }} style={styles.image} />

      {/* Discount Badge */}
      {product.discount ? (
        <View style={styles.discount}>
          <Text style={styles.discountText}>{product.discount}% OFF</Text>
        </View>
      ) : null}

      {/* Slogan Badge (modern overlay) */}
      {product.title ? (
        <View style={styles.sloganBadge}>
          <Text style={styles.sloganText} numberOfLines={1}>
            🔥 {product.title}
          </Text>
        </View>
      ) : null}

      {/* Product Name */}
      <Text style={styles.title} numberOfLines={2}>
        {product.name}
      </Text>

      {/* Info Section */}
      <View style={styles.info}>
        <Text style={styles.price}>৳ {product.price}</Text>
        <TouchableOpacity style={styles.buyBtn} onPress={handleBuy}>
          <Text style={styles.buyText}>বিস্তারিত দেখুন</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 8,
    elevation: 5,
    width: '100%',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 220,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    resizeMode: 'cover',
  },
  discount: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 50,
    zIndex: 10,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  sloganBadge: {
    position: 'absolute',
    bottom: 120,
    right: 16,
    backgroundColor: '#d7f4efff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
    borderWidth:2,
    borderColor:'#ff2200ff'
  },
  sloganText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  info: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1b10b9ff',
    marginBottom: 12,
  },
  buyBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buyText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
