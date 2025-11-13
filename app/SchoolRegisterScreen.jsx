import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { useRouter } from "expo-router";
import Checkbox from "expo-checkbox";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { uploadImages } from "../request/UploadImages";
import axios from "axios";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;
// Validation schema
const validationSchema = Yup.object().shape({
  schoolName: Yup.string().required("স্কুল এর নাম আবশ্যক"),
  principalName: Yup.string().required("প্রধান শিক্ষকের নাম আবশ্যক"),
  email: Yup.string().email("সঠিক ইমেইল দিন").required("ইমেইল আবশ্যক"),
  phone: Yup.string()
    .matches(/^[0-9]{11}$/, "ফোন নাম্বার ১১ সংখ্যার হতে হবে")
    .required("ফোন নাম্বার আবশ্যক"),
  contactNumber: Yup.string()
    .matches(/^[0-9]{11}$/, " যোগাযোগ নাম্বার ১১ সংখ্যার হতে হবে")
    .required("যোগাযোগ নাম্বার আবশ্যক"),
  union: Yup.string().required("ইউনিয়নের নাম আবশ্যক"),
  district: Yup.string().required("জেলার নাম আবশ্যক"),
  secretName: Yup.string().required("সিক্রেট নাম আবশ্যক"),
  password: Yup.string()
    .min(6, "পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে")
    .required("পাসওয়ার্ড আবশ্যক"),
  wordNo:Yup.number().required("সিটি কর্পোরেশন ওয়ার্ড নং আবশ্যক"),
  clientId:Yup.string().required("গ্রাহক আইডি আবশ্যক"),
  terms: Yup.boolean()
    .oneOf([true], "শর্তাবলী মেনে নিতে হবে")
    .required("শর্তাবলী মেনে নিতে হবে"),
});
export default function SchoolRegisterScreen() {
  const [loading, setLoading] = useState(false);
  const  router = useRouter();
  const [logoUri, setLogoUri] = useState(null);
  const [coverUri, setCoverUri] = useState(null);
  const [processingLogo, setProcessingLogo] = useState(false);
  const [processingCover, setProcessingCover] = useState(false);

  // Image picker
  const pickImage = async (type = "cover") => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Cannot access gallery without permission");
      return;
    }

    try {
      type === "logo" ? setProcessingLogo(true) : setProcessingCover(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled) return;
      const picked = result.assets[0];

      const manipulated = await ImageManipulator.manipulateAsync(
        picked.uri,
        [{ resize: { width: type === "logo" ? 800 : 1200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      type === "logo" ? setLogoUri(manipulated.uri) : setCoverUri(manipulated.uri);
    } catch (err) {
      console.error("pickImage error:", err);
      Alert.alert("Error", "Could not process the selected image.");
    } finally {
      type === "logo" ? setProcessingLogo(false) : setProcessingCover(false);
    }
  };

  // Form submit
  const onFormSubmit = async (values, { resetForm }) => {
    setLoading(true);
    try {
      let logoUrl = "";
      let coverUrl = "";

      // Upload logo
      if (logoUri) {
        const formData = new FormData();
        formData.append("file", {
          uri: logoUri,
          type: "image/jpeg",
          name: "logo.jpg",
        });
        const [uploadedLogo] = await uploadImages(formData);
        logoUrl = uploadedLogo;
      }

      // Upload cover
      if (coverUri) {
        const formData = new FormData();
        formData.append("file", {
          uri: coverUri,
          type: "image/jpeg",
          name: "cover.jpg",
        });
        const [uploadedCover] = await uploadImages(formData);
        coverUrl = uploadedCover;
      }

      const payload = { ...values, logo: logoUrl, cover: coverUrl };
    
      console.log(payload)

      const res = await axios.post(`${API_URL}/api/school/register`, payload);
  
      router.push(`/SchoolLoginScreen`);

      Alert.alert("Success", "Form submitted successfully!");
      resetForm();
      setLogoUri(null);
      setCoverUri(null);

    } catch (error) {
      console.error("school registration error:", error.response || error);
      Alert.alert(
        "ত্রুটি",
        error.response?.data?.message || "কিছু ভুল হয়েছে, আবার চেষ্টা করুন"
      );
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>এডমিন রেজিস্ট্রেশন</Text>

        <Formik
          initialValues={{
            schoolName: "",
            principalName: "",
            email: "",
            phone: "",
            contactNumber:"",
            union: "",
            district: "",
            secretName: "",
            password: "",
            clientId:"",
            wordNo:"",
            terms: false,
          }}
          validationSchema={validationSchema}
          onSubmit={onFormSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
            <View style={styles.form}>
              {/* Cover */}
              <TouchableOpacity style={styles.imageBox} onPress={() => pickImage("cover")}>
                {processingCover ? (
                  <View style={[styles.coverPlaceholder, styles.processing]}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.processingText}>Processing...</Text>
                  </View>
                ) : coverUri ? (
                  <Image source={{ uri: coverUri }} style={styles.coverImage} />
                ) : (
                  <Image source={require("../assets/image/no-image.jpg")} style={styles.coverImage} />
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoBox} onPress={() => pickImage("logo")}>
                {processingLogo ? (
                  <View style={[styles.logoPlaceholder, styles.processing]}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                ) : logoUri ? (
                  <Image source={{ uri: logoUri }} style={styles.logoImage} />
                ) : (
                  <Image source={require("../assets/icons/icon2.png")} style={styles.logoImage} />
                )}
              </TouchableOpacity>

              {/* Text Inputs */}
              {[
                { label: "স্কুলের নাম", field: "schoolName" },
                { label: "প্রধান শিক্ষকের নাম", field: "principalName" },
                { label: "ইমেইল", field: "email", keyboard: "email-address" },
                { label: "মোবাইল নাম্বার", field: "phone", keyboard: "phone-pad" },
                { label: "যোগাযোগ নাম্বার", field: "contactNumber", keyboard: "phone-pad" },
                { label: "ওয়ার্ড নং", field: "wordNo", keyboard: "phone-pad" },
                { label: "কাস্টমার কেয়ার থেকে প্রাপ্ত গ্রাহক আইডি আবশ্যক", field: "clientId"},
                { label: "ইউনিয়ন/গ্রাম", field: "union" },
                { label: "সিক্রেট নাম", field: "secretName" },
                { label: "পাসওয়ার্ড", field: "password", secure: true },
              ].map((item) => (
                <View style={styles.inputGroup} key={item.field}>
                  <Text style={styles.label}>{item.label}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={`${item.label} লিখুন`}
                    value={values[item.field]}
                    onChangeText={handleChange(item.field)}
                    onBlur={handleBlur(item.field)}
                    secureTextEntry={item.secure || false}
                    keyboardType={item.keyboard || "default"}
                  />
                  {errors[item.field] && touched[item.field] && (
                    <Text style={styles.error}>{errors[item.field]}</Text>
                  )}
                </View>
              ))}

              {/* District Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>জেলা নির্বাচন করুন</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={values.district}
                    onValueChange={(val) => setFieldValue("district", val)}
                    style={styles.picker}
                  >
                    <Picker.Item label="নির্বাচন করুন" value="" />
                    <Picker.Item label="ঢাকা" value="dhaka" />
                    <Picker.Item label="গাজীপুর" value="gazipur" />
                    <Picker.Item label="নারায়ণগঞ্জ" value="narayanganj" />
                    <Picker.Item label="চট্টগ্রাম" value="chittagong" />
                    <Picker.Item label="অন্যান্য" value="others" />
                  </Picker>
                </View>
                {errors.district && touched.district && <Text style={styles.error}>{errors.district}</Text>}
              </View>

              {/* Terms */}
              <View style={styles.termsBox}>
              <ScrollView style={styles.termsText} nestedScrollEnabled>
           <Text style={styles.termsTitle}>শর্তাবলী ও নিয়মাবলী:</Text>
          {[
            "প্রতিটি ছাত্র ও শিক্ষকের জন্য বৈধ স্কুল আইডি ও লগইন তথ্য থাকা আবশ্যক।",
            "ছাত্রদের তথ্য কেবলমাত্র শিক্ষা ব্যবস্থাপনা ও রিপোর্টিংয়ের জন্য ব্যবহার করা যাবে, অন্য কারও সাথে শেয়ার করা যাবে না।",
            "অ্যাপ বা সিস্টেমে কোনো অবৈধ কার্যক্রম বা অনুমোদনহীন প্রবেশাধিকার শনাক্ত হলে সংশ্লিষ্ট অ্যাকাউন্ট স্থগিত বা বাতিল করা হতে পারে।",
            "শিক্ষক ও প্রশাসকরা শুধুমাত্র অনুমোদিত কার্যক্রম সম্পাদন করতে পারবেন।",
            "প্রয়োজনে প্রশাসন বা ডেভেলপাররা নিয়মাবলী পরিবর্তন করতে পারে এবং সকল ব্যবহারকারীর সেই নিয়ম মানা বাধ্যতামূলক।",
          ].map((item, i) => (
            <Text key={i} style={styles.termsItem}>
              {`${i + 1}. ${item}`}
            </Text>
          ))}

            </ScrollView>
                <View style={styles.checkboxRow}>
                  <Checkbox
                    value={values.terms}
                    onValueChange={(val) => setFieldValue("terms", val)}
                    color={values.terms ? "#6366F1" : undefined}
                  />
                  <Text style={styles.checkboxLabel}> আমি উপরের শর্তাবলী মেনে নিচ্ছি</Text>
                </View>
              </View>
              {errors.terms && touched.terms && <Text style={styles.error}>{errors.terms}</Text>}

              {/* Submit */}
              <View style={{marginBottom:40}}>
                <TouchableOpacity
                style={[styles.submitButton, !values.terms && { backgroundColor: "#9CA3AF" }]}
                onPress={handleSubmit}
                disabled={loading || !values.terms}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>রেজিস্টার করুন</Text>}
              </TouchableOpacity>
              </View>
             
            </View>
          )}
        </Formik>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15, backgroundColor: "#F3F4F6", flexGrow: 1 },
  pickerContainer: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, backgroundColor: "#fff",color:"#374151" },
  picker: { height: 50, color: "#374151" },
  label: { fontSize: 16, fontWeight: "600", color: "#374151", marginBottom: 6 },
  inputGroup: { marginBottom: 12 },
  imageBox: { marginVertical: 10, alignItems: "center" },
  coverImage: { width: "100%", height: 150, borderRadius: 10, resizeMode: "cover" },
  coverPlaceholder: { width: "100%", height: 150, borderRadius: 10, backgroundColor: "#d0d7df", alignItems: "center", justifyContent: "center" },
  logoBox: { marginVertical: 8, alignItems: "center" },
  logoImage: { width: 110, height: 110, borderRadius: 55, resizeMode: "cover", marginTop: -75, borderColor: "#653ef0ff", borderWidth: 4 },
  logoPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: "#d0d7df", alignItems: "center", justifyContent: "center" },
  processing: { opacity: 0.9, backgroundColor: "#00000066" },
  processingText: { color: "#fff", marginTop: 8 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10, color: "#2a3b9eff", textAlign: "center" },
  form: { flex: 1 },
  input: { borderWidth: 1, borderColor: "#D1D5DB", padding: 14, borderRadius: 6, backgroundColor: "#fff", fontSize: 16, color: "#3c3c3cff" },
  error: { color: "#EF4444", fontSize: 13, marginTop: 4 },
  submitButton: { marginTop: 20, backgroundColor: "#6366F1", padding: 15, borderRadius: 12, alignItems: "center" },
  submitText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  termsBox: { marginTop: 15, marginBottom: 10, padding: 10, borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 10, backgroundColor: "#fff" },
  termsText: { maxHeight: 130, marginBottom: 8 },
  termsTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 5, color: "#111827" },
  termsItem: { fontSize: 14, color: "#374151", marginBottom: 3, lineHeight: 20 },
  checkboxRow: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  checkboxLabel: { marginLeft: 8, color: "#374151", fontSize: 14 },
});

