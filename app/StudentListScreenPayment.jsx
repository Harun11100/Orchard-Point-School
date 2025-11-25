import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;
export default function FeeCollectionScreen() {
  const { schoolId, classId,className,sectionName} = useLocalSearchParams();
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const STORAGE_KEY = `students_${classId}`;
   const router = useRouter();
  const today = new Date();
  const formattedDate = today.toLocaleDateString("bn-BD", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });


  /** 🔹 Fetch students from backend */
  const fetchStudentsFromDb = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/school/student/getStudents?schoolId=${schoolId}&classId=${classId}`
      );
      const fetched = res.data.data;

      setStudents(fetched);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fetched));
    } catch (err) {
      console.error("❌ Error fetching students:", err);
      Alert.alert("ত্রুটি", "সার্ভার থেকে ছাত্রদের তথ্য আনতে ব্যর্থ হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  /** 🔹 Load from AsyncStorage, then fetch fresh */
  const loadStudents = async () => {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        setStudents(parsed);
      }
      await fetchStudentsFromDb();
    } catch (err) {
      console.error("Error loading students:", err);
      await fetchStudentsFromDb();
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  /** 🔹 Reactive filtering */
  useEffect(() => {
    if (activeFilter === "all") setFiltered(students);
    else setFiltered(students.filter((s) => s.paymentStatus === activeFilter));
  }, [students, activeFilter]);

  /** 🔹 Manual filter change */
  const handleFilterChange = (status) => setActiveFilter(status);

  /** 🔹 Toggle payment status */
const changeStatus = (item) => {
  // Prevent changing from 'paid' to 'unpaid'
  if (item.paymentStatus === "paid") {
    Alert.alert("দুঃখিত ", "একবার 'paid' হওয়ার পরে স্ট্যাটাস পরিবর্তন  করতে হলে  পেমেন্ট ইতিহাস পেজ থেকে পরিবরতন করতে হবে ।");
    return;
  }

  const newStatus = "paid"; 

  Alert.alert(
    "স্ট্যাটাস পরিবর্তন নিশ্চিতকরণ",
    `${item.name} এর স্ট্যাটাস '${item.paymentStatus}' থেকে '${newStatus}' এ পরিবর্তন করতে চান?`,
    [
      { text: "বাতিল", style: "cancel" },
      {
        text: "হ্যাঁ, পরিবর্তন করুন",
        onPress: async () => {
          try {
            const res = await axios.put(
              `${API_URL}/api/school/updatePaymentStatus`,
              { studentId: item._id, classId, status: newStatus },
              { headers: { "Content-Type": "application/json" } }
            );

            if (res.data.success) {
              const updated = students.map((s) =>
                s._id === item._id ? { ...s, paymentStatus: newStatus } : s
              );
              setStudents(updated);
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } else {
              Alert.alert("ব্যর্থ", "স্ট্যাটাস পরিবর্তন করা যায়নি।");
            }
          } catch (err) {
            console.error(err);
            Alert.alert("ত্রুটি", "স্ট্যাটাস পরিবর্তনের সময় সমস্যা হয়েছে।");
          }
        },
      },
    ]
  );
};


const handlePaymentAction = (item) => {

  Alert.alert(
    "অ্যাকশন নির্বাচন করুন",
    `${item.name} এর জন্য আপনি কি করতে চান?`,
    [
      { text: "বাতিল", style: "cancel" },
      {
        text: "বার্তা পাঠান",
        onPress: async () => {
          try {
            const res = await fetch(
              `${API_URL}/api/school/send-notification`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  studentId: item._id,
                  title: "স্কুলের বেতন স্মরণ করানো হচ্ছে",
                  body: `${item.name} এর গত মাসের স্কুলের বেতন এখনো বাকি। দ্রুত পরিশোধ করার জন্য অনুরোধ করা হল।`,
                }),
              }
            );
            const data = await res.json();
            Alert.alert(
              data.success ? "সফল" : "ব্যর্থ",
              data.success
                ? "বার্তা পাঠানো হয়েছে!"
                : "বার্তা পাঠানো যায়নি।"
            );
          } catch (err) {
            console.error(err);
            Alert.alert("ত্রুটি", "বার্তা পাঠানোর সময় সমস্যা হয়েছে।");
          }
        },
      },
      {
        text: "পেমেন্ট হিস্ট্রি সংরক্ষণ করুন",
        onPress: async () => {
          try {
            const res = await fetch(
              `${API_URL}/api/school/save-payment-history`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId: item._id,schoolId }),
              }
            );
            const data = await res.json();
            Alert.alert(
              data.success ? "সফল" : "ব্যর্থ",
              data.success
                ? "পেমেন্ট হিস্ট্রি সংরক্ষণ করা হয়েছে!"
                : "সংরক্ষণ করতে সমস্যা হয়েছে।"
            );
          } catch (err) {
            console.error(err);
            Alert.alert("ত্রুটি", "পেমেন্ট সংরক্ষণ করার সময় সমস্যা হয়েছে।");
          }
        },
      },
    ]
  );
};
 
    if (!students.length) {
      return (
        <View style={styles.loadingContainer}>
          <Image style={styles.image} source={require("../assets/image/empty.png")}/>
          <Text style={styles.emptyText}>কোন তথ্য পাওয়া যায়নি</Text>
        </View>
      );
    }

  return (
    <View style={styles.container}>
     <Text style={styles.header}>বেতন সংগ্রহ</Text>
      <View style={styles.wrapper} >
      <View  style={styles.wrap}>
      <Text style={styles.subHeader}>{className}</Text>
      <Text style={styles.subHeader}> {sectionName}</Text>
      </View> 
     
      <Text style={styles.date}>{formattedDate}</Text>
      </View>
     
      <View style={styles.filter}>
        {["all", "paid", "unpaid"].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterBtn,
              activeFilter === status && styles.activeBtn,
            ]}
            onPress={() => handleFilterChange(status)}
           >
            <Text
              style={[
                styles.filterBtnTxt,
                activeFilter === status && styles.activeBtnTxt,
              ]}
            >
              {status === "all"
                ? "সকল"
                : status === "paid"
                ? "পরিশোধিত"
                : "অপরিশোধিত"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#115bb5ff" />
        </View>
       
      ) : (
         
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
             onPress={() =>
              router.push({
              pathname: "/StudentPaymentHistory",
              params: {
              schoolId,
              classId,
              studentId:item._id
            },
          })
          }
            style={styles.card}
            >
              <LinearGradient colors={["#ffffff", "#f3f4f6"]} style={styles.gradient}>
                <View style={styles.topRow}>
                  <View>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.phone}>রোল নং: {item.roll}</Text>
                  </View>
                  <View style={styles.amounts}>
                    {item.paymentStatus === "paid" ? (
                      <Text style={styles.amount}>পরিশোধিত: {item.tuitionFee+item.coachingFee}৳</Text>
                    ) : (
                      <>
                        <Text style={styles.due}>বাকি: {item.tuitionFee+item.coachingFee}৳</Text>
                        <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: "#0ea5e9" }]}
                        onPress={() => handlePaymentAction(item)}
                        >
                          <Text style={styles.actionBtnTxt}>বার্তা পাঠান</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.bottomRow}>
                  <View
                    style={[
                      styles.statusBadge,
                      item.paymentStatus === "paid"
                        ? { backgroundColor: "#22c55e" }
                        : { backgroundColor: "#ef4444" },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {item.paymentStatus === "paid" ? "পরিশোধিত" : "অপরিশোধিত"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => changeStatus(item)}
                  >
                    <Text style={styles.actionBtnTxt}>স্ট্যাটাস পরিবর্তন</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
           contentContainerStyle={{ paddingBottom: 30 }} 
        />
  
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4faff", paddingHorizontal: 16, paddingTop: 15 },
   loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5ffff"
  },
  wrapper:{flexDirection:"row" , justifyContent:"space-between", marginHorizontal:10},
  wrap:{flexDirection:"row" , justifyContent:"space-between",},
  header: { fontSize: 24, fontWeight: "700", textAlign: "center",color: "#315cb2ff", marginBottom: 10 },
  subHeader: { fontSize: 17, fontWeight: "700", textAlign: "center", color: "#505257ff", marginBottom: 10 },
  date: { textAlign: "center", fontSize: 14, color: "#6b7280", marginBottom: 5 },
  btn: { backgroundColor: "#6366F1", padding: 10, borderRadius: 10, marginVertical: 10, alignItems: "center" },
  btnTxt: { color: "#fff", fontWeight: "600" },
  filter: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 10 },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 25, backgroundColor: "#e5e7eb" },
  filterBtnTxt: { color: "#374151", fontSize: 14 },
  activeBtn: { backgroundColor: "#6366F1" },
  activeBtnTxt: { color: "#fff" },
  card: { borderRadius: 14, overflow: "hidden", marginVertical: 6, elevation: 2, margin: 2 },
  gradient: { padding: 16 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 18, fontWeight: "700", color: "#111827" },
  phone: { fontSize: 14, color: "#434444ff" },
  amounts: { alignItems: "flex-end" },
  amount: { color: "#16a34a", fontWeight: "600" },
  due: { color: "#dc2626", fontWeight: "700", marginBottom: 5 },
  divider: { height: 1, backgroundColor: "#e5e7eb", marginVertical: 8 },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { color: "#fff", fontWeight: "600" },
  actionBtn: { backgroundColor: "#6366F1", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  actionBtnTxt: { color: "#fff", fontSize: 13, fontWeight: "600" },
  resetBtn: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#6366F1",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { backgroundColor: "#fff", borderRadius: 12, padding: 20, width: "85%" },
  modalTitle: { textAlign: "center", fontSize: 18, fontWeight: "700", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginBottom: 15 },
  modalActions: { flexDirection: "row", justifyContent: "space-between" },
  actionTxt: { color: "#fff", fontWeight: "600", fontSize: 16 },
   image:{
    height:280,
    width:280
  },
  emptyText: {
    fontSize: 18,
    color: "#555",
  },
});
