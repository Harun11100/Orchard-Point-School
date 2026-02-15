import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import Constants from 'expo-constants';
import { filterStudentsByRollAndStatus } from "./utils/filterStudents";
import RollFilter from "../components/RollFilter";
const API_URL = Constants.expoConfig.extra.API_URL;
export default function StudentListScreen() {
  const { schoolId, classId, classes } = useLocalSearchParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0);
  const router = useRouter();
const [rollQuery, setRollQuery] = useState("");
 const [filtered, setFiltered] = useState(students);
  const classData = classes ? JSON.parse(classes) : null;
  const STORAGE_KEY = `students_${classId}`;
     useEffect(() => {
     if (!rollQuery.trim()) {
        setFiltered(students);
      } else {
        setFiltered(
          students.filter((s) =>
            String(s.roll).includes(rollQuery.trim())
          )
        );
      }
    }, [students, rollQuery]);
  const normalizeStudent = (student) => ({
    _id: student._id,
    name: student.name || "N/A",
    roll: student.roll || "N/A",
  });

  const fetchStudentsFromDb = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/school/student/getStudents?schoolId=${schoolId}&classId=${classId}`
      );
      const fetchedStudents = res.data.data.map(normalizeStudent);
      setTotalStudents(res.data.totalStudents);
      setStudents(fetchedStudents);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fetchedStudents));
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadStudents = async () => {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData) setStudents(JSON.parse(storedData).map(normalizeStudent));
      await fetchStudentsFromDb();
    } catch (err) {
      console.error("Error loading students:", err);
      await fetchStudentsFromDb();
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStudentsFromDb();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/StudentResultViewScreen",
          params: { classId, schoolId, studentId: item._id },
        })
      }
    >
      <View
        style={styles.gradientCard}
      >
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.rollNumber}>রোল নম্বর: {item.roll}</Text>

      </View>
       <Ionicons
        name="arrow-forward-circle-outline"
        size={30}
        color="#2f75dfff"
       />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
         <ActivityIndicator size="large" color="#115bb5ff" />
      </View>
    );
  }

  if (!students.length) {
    return (
      <View style={styles.loadingContainer}>
        <Image style={styles.image} source={require("../assets/image/empty.png")}/>
        <Text style={styles.emptyText}>কোন তথ্য পাওয়া যায়নি</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={filtered}
      renderItem={renderItem}
      keyExtractor={(item) => item._id}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
       
        <>
          <Text style={styles.header}>পরীক্ষার ফলাফল</Text>
          {classData && (
            <View style={styles.classCard}>
              <View style={{flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
              <Text style={styles.totalStudents}>মোট ছাত্র-ছাত্রী: {totalStudents}</Text>
             
              </View>
             <View style={styles.headerRow}>
              <View style={styles.classInfo}>
                <Text style={styles.className}>{classData.className}</Text>
                {classData.sectionName ? (
                  <Text style={styles.sectionName}>
                    সেকশন {classData.sectionName}
                  </Text>
                ) : null}
              </View>

              <RollFilter value={rollQuery} onChange={setRollQuery} />
            </View>

             
            </View>
            )}
         </>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f5ffff",
    paddingHorizontal: 15,
  },
   header: { fontSize: 24, fontWeight: "700", textAlign: "center",  color: "#315cb2ff", marginTop:10 },
   loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f5ffff",
  },
  classCard: {
    alignItems:'center',
    borderRadius: 14,
    marginBottom: 6,
  },
  headerRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginHorizontal:4,
  marginVertical:4,
},

classInfo: {
  flex: 1,
},

className: {
  fontSize: 18,
  fontWeight: "700",
  color: "#111827",
},

sectionName: {
  fontSize: 13,
  color: "#6B7280",
  marginTop: 2,
},

  totalStudents: { fontSize: 14, fontWeight: "500", color: "#4B5563" },
  card: {
    flexDirection:'row',
    marginVertical: 6,
    justifyContent:'space-between',
    alignContent:'center',
    alignItems:'center',
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor:'#fff',
    elevation:3,
    padding:5
  },
  gradientCard: {
    padding: 16,
  },
  studentName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#272626ff",
  },
  rollNumber: {
    fontSize: 15,
    fontWeight: "500",
    color: "#5d5d5dff",
    marginTop: 3,
  },
  image:{
    height:280,
    width:280
  },
  emptyText: {
    fontSize: 18,
    color: "#555",
  },
});
