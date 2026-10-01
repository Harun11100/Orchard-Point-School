import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

import {
  MaterialIcons,
  Ionicons,
} from "@expo/vector-icons";

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import axios from "axios";
import Constants from "expo-constants";

const FeeCollectionScreen = () => {
  const router = useRouter();

  // =====================================================
  // ROUTE PARAMS
  // =====================================================

  const {
    schoolId,
    classId,
    studentId,
    studentName,
    roll,
    className,
    section,
    tutionFee,
    coachingFee,
  } = useLocalSearchParams();

console.log(
  `School ID: ${schoolId}\n` +
  `Class ID: ${classId}\n` +
  `Student ID: ${studentId}\n` +
  `Student Name: ${studentName}\n` +
  `Roll: ${roll}\n` +
  `Class Name: ${className}\n` +
  `Section: ${section}\n` +
  `Tuition Fee: ${tutionFee}\n` +
  `Coaching Fee: ${coachingFee}`
);


  // =====================================================
  // API URL
  // =====================================================

  const API_URL =
    Constants.expoConfig?.extra?.API_URL;

  // =====================================================
  // STUDENT
  // =====================================================

  const student = {
    _id: studentId || "",
    name: studentName || "Student",
    roll: roll || "",
    className: className || "",
    section: section || "",
  };

  // =====================================================
  // STATES
  // =====================================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [feeCollection, setFeeCollection] =
    useState(null);

  const [defaultFees, setDefaultFees] = useState({
    tutionFee: Number(
      tutionFee ?? tutionFee ?? 0
    ),
    coachingFee: Number(coachingFee ?? 0),
    otherMonthlyFee: 0,
  });

  const [monthlyFees, setMonthlyFees] =
    useState([]);

  const [otherFees, setOtherFees] =
    useState([]);

  const [paymentHistory, setPaymentHistory] =
    useState([]);

  // =====================================================
  // PAYMENT STATES
  // =====================================================

  const [paymentAmount, setPaymentAmount] =
    useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("cash");

  const [showPaymentModal, setShowPaymentModal] =
    useState(false);

  // =====================================================
  // OTHER FEE STATES
  // =====================================================

  const [showOtherFeeModal, setShowOtherFeeModal] =
    useState(false);

  const [newOtherFee, setNewOtherFee] = useState({
    feeType: "exam",
    title: "",
    amount: "",
  });

  // =====================================================
  // FETCH FEE COLLECTION
  // =====================================================

  const fetchFeeCollection = useCallback(
    async (showLoader = true) => {
      if (!schoolId || !studentId) {
        setLoading(false);
        return;
      }

      if (!API_URL) {
        setLoading(false);

        Alert.alert(
          "Configuration Error",
          "API URL is not configured."
        );

        return;
      }

      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const response = await axios.get(
          `${API_URL}/api/school/fee/getFeeCollection`,
          {
            params: {
              schoolId,
              studentId,
            },
          }
        );

        const data =
          response.data?.feeCollection ||
          response.data?.data ||
          response.data;

        if (!data) {
          setFeeCollection(null);
          setMonthlyFees([]);
          setOtherFees([]);
          setPaymentHistory([]);
          return;
        }

        setFeeCollection(data);

        // -------------------------------------------------
        // DEFAULT FEES
        // -------------------------------------------------

        setDefaultFees({
          tutionFee: Number(
            data.defaultFees?.tutionFee ??
              tutionFee ??
              tutionFee ??
              0
          ),

          coachingFee: Number(
            data.defaultFees?.coachingFee ??
              coachingFee ??
              0
          ),

          otherMonthlyFee: Number(
            data.defaultFees?.otherMonthlyFee ?? 0
          ),
        });

        // -------------------------------------------------
        // MONTHLY FEES
        // -------------------------------------------------

        setMonthlyFees(
          (data.monthlyFees || []).map((item) => ({
            ...item,

            totalFee: Number(
              item.totalFee || 0
            ),

            paidAmount: Number(
              item.paidAmount || 0
            ),

            dueAmount: Number(
              item.dueAmount || 0
            ),
          }))
        );

        // -------------------------------------------------
        // OTHER FEES
        // -------------------------------------------------

        setOtherFees(
          (data.otherFees || []).map((item) => ({
            ...item,

            amount: Number(
              item.amount || 0
            ),

            paidAmount: Number(
              item.paidAmount || 0
            ),

            dueAmount: Number(
              item.dueAmount || 0
            ),
          }))
        );

        // -------------------------------------------------
        // PAYMENT HISTORY
        // -------------------------------------------------

        setPaymentHistory(
          data.payments || []
        );
      } catch (error) {
        console.error(
          "Fee collection fetch error:",
          error?.response?.data || error
        );

        Alert.alert(
          "Unable to Load Fees",
          error?.response?.data?.message ||
            "Could not load this student's fee information."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      API_URL,
      schoolId,
      studentId,
      tutionFee,
      coachingFee,
    ]
  );

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchFeeCollection();
  }, [fetchFeeCollection]);

  // =====================================================
  // REFRESH
  // =====================================================

  const onRefresh = useCallback(() => {
    fetchFeeCollection(false);
  }, [fetchFeeCollection]);

  // =====================================================
  // CALCULATIONS
  // =====================================================

  const totalMonthlyDue = useMemo(() => {
    return monthlyFees.reduce(
      (sum, item) =>
        sum + Number(item.dueAmount || 0),
      0
    );
  }, [monthlyFees]);

  const totalOtherDue = useMemo(() => {
    return otherFees.reduce(
      (sum, item) =>
        sum + Number(item.dueAmount || 0),
      0
    );
  }, [otherFees]);

  const totalDue =
    totalMonthlyDue + totalOtherDue;

  const totalMonthlyFee =
    Number(defaultFees.tutionFee || 0) +
    Number(defaultFees.coachingFee || 0) +
    Number(defaultFees.otherMonthlyFee || 0);

  // Backend totalPaid includes payments that may have
  // been stored as advance.
  const totalPaid = useMemo(() => {
    if (
      feeCollection?.totalPaid !== undefined &&
      feeCollection?.totalPaid !== null
    ) {
      return Number(
        feeCollection.totalPaid || 0
      );
    }

    const monthlyPaid =
      monthlyFees.reduce(
        (sum, item) =>
          sum +
          Number(item.paidAmount || 0),
        0
      );

    const otherPaid =
      otherFees.reduce(
        (sum, item) =>
          sum +
          Number(item.paidAmount || 0),
        0
      );

    return monthlyPaid + otherPaid;
  }, [
    feeCollection,
    monthlyFees,
    otherFees,
  ]);

  // =====================================================
  // PAYMENT ALLOCATION PREVIEW
  // =====================================================

  const paymentAllocation = useMemo(() => {
    let remaining =
      Number(paymentAmount || 0);

    if (!remaining || remaining <= 0) {
      return [];
    }

    const allocations = [];

    // ---------------------------------------------------
    // Sort monthly fees oldest first
    // ---------------------------------------------------

    const sortedMonthlyFees = [
      ...monthlyFees,
    ].sort((a, b) => {
      const aKey =
        a.monthKey ||
        `${a.year || 0}-${String(
          a.month || 0
        ).padStart(2, "0")}`;

      const bKey =
        b.monthKey ||
        `${b.year || 0}-${String(
          b.month || 0
        ).padStart(2, "0")}`;

      return aKey.localeCompare(bKey);
    });

    // ---------------------------------------------------
    // Monthly dues first
    // ---------------------------------------------------

    for (const fee of sortedMonthlyFees) {
      if (remaining <= 0) {
        break;
      }

      const due =
        Number(fee.dueAmount || 0);

      if (due > 0) {
        const allocated =
          Math.min(remaining, due);

        allocations.push({
          type: "monthly",
          id: fee._id,
          title:
            fee.monthName ||
            fee.monthKey ||
            `${fee.month || ""} ${
              fee.year || ""
            }`.trim() ||
            "Monthly Fee",
          amount: allocated,
        });

        remaining -= allocated;
      }
    }

    // ---------------------------------------------------
    // Other fees next
    // ---------------------------------------------------

    for (const fee of otherFees) {
      if (remaining <= 0) {
        break;
      }

      const due =
        Number(fee.dueAmount || 0);

      if (due > 0) {
        const allocated =
          Math.min(remaining, due);

        allocations.push({
          type: "other",
          id: fee._id,
          title:
            fee.title || "Other Fee",
          amount: allocated,
        });

        remaining -= allocated;
      }
    }

    // ---------------------------------------------------
    // Extra = Advance
    // ---------------------------------------------------

    if (remaining > 0) {
      allocations.push({
        type: "advance",
        id: "advance",
        title: "Advance Balance",
        amount: remaining,
      });
    }

    return allocations;
  }, [
    paymentAmount,
    monthlyFees,
    otherFees,
  ]);

  // =====================================================
  // COLLECT PAYMENT CONFIRMATION
  // =====================================================

  const handleCollectPayment = () => {
    const amount =
      Number(paymentAmount);

    if (!amount || amount <= 0) {
      Alert.alert(
        "Invalid Amount",
        "Please enter a valid payment amount."
      );

      return;
    }

    Alert.alert(
      "Confirm Payment",
      `Collect ৳${amount.toLocaleString()} from ${student.name}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Confirm",
          onPress: processPayment,
        },
      ]
    );
  };

  // =====================================================
  // PROCESS PAYMENT
  // =====================================================

  const processPayment = async () => {
    const amount =
      Number(paymentAmount);

    if (!amount || amount <= 0) {
      return;
    }

    if (!schoolId || !studentId) {
      Alert.alert(
        "Error",
        "School or student information is missing."
      );

      return;
    }

    if (!API_URL) {
      Alert.alert(
        "Configuration Error",
        "API URL is not configured."
      );

      return;
    }

    try {
      setSaving(true);

      // IMPORTANT:
      // Do NOT send "advance" as chargeType.
      // The backend should automatically put
      // any remaining amount into advanceBalance.

      const allocations =
        paymentAllocation
          .filter(
            (item) =>
              item.type === "monthly" ||
              item.type === "other"
          )
          .map((item) => ({
            chargeType: item.type,
            chargeId: item.id,
            amount: item.amount,
            description: item.title,
          }));

      const response =
        await axios.post(
          `${API_URL}/api/school/fee/collectPayment`,
          {
            schoolId,
            classId,
            studentId,
            amount,
            paymentMethod,
            allocations,
          }
        );

      const receiptNumber =
        response.data?.payment
          ?.receiptNumber ||
        response.data?.receiptNumber ||
        "Generated";

      setPaymentAmount("");

      setShowPaymentModal(false);

      await fetchFeeCollection();

      Alert.alert(
        "Payment Successful",
        `Payment of ৳${amount.toLocaleString()} collected successfully.\n\nReceipt: ${receiptNumber}`
      );
    } catch (error) {
      console.error(
        "Payment error:",
        error?.response?.data || error
      );

      Alert.alert(
        "Payment Failed",
        error?.response?.data?.message ||
          "Could not save the payment."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // ADD OTHER FEE
  // =====================================================

  const handleAddOtherFee = async () => {
    const amount =
      Number(newOtherFee.amount);

    if (!newOtherFee.title.trim()) {
      Alert.alert(
        "Required",
        "Please enter fee title."
      );

      return;
    }

    if (!amount || amount <= 0) {
      Alert.alert(
        "Required",
        "Please enter a valid amount."
      );

      return;
    }

    if (!schoolId || !studentId) {
      Alert.alert(
        "Error",
        "School or student information is missing."
      );

      return;
    }

    if (!API_URL) {
      Alert.alert(
        "Configuration Error",
        "API URL is not configured."
      );

      return;
    }

    try {
      setSaving(true);

      await axios.post(
        `${API_URL}/api/school/fee/addOtherFee`,
        {
          schoolId,
          classId,
          studentId,
          feeType:
            newOtherFee.feeType,
          title:
            newOtherFee.title.trim(),
          amount,
        }
      );

      setNewOtherFee({
        feeType: "exam",
        title: "",
        amount: "",
      });

      setShowOtherFeeModal(false);

      await fetchFeeCollection();

      Alert.alert(
        "Success",
        "Other fee added successfully."
      );
    } catch (error) {
      console.error(
        "Add other fee error:",
        error?.response?.data || error
      );

      Alert.alert(
        "Failed",
        error?.response?.data?.message ||
          "Could not add the fee."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="#0866D8"
        barStyle="light-content"
      />

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#fff"
          />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            Fee Collection
          </Text>

          <Text style={styles.headerSubtitle}>
            Student Payment
          </Text>
        </View>

        <TouchableOpacity
          onPress={() =>
            setShowOtherFeeModal(true)
          }
          style={styles.headerAddButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name="add"
            size={25}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* ================================================= */}
      {/* LOADING / CONTENT */}
      {/* ================================================= */}

      {loading ? (
        <View
          style={styles.loadingContainer}
        >
          <ActivityIndicator
            size="large"
            color="#0866D8"
          />

          <Text style={styles.loadingText}>
            Loading fee information...
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.scrollContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#0866D8"]}
              tintColor="#0866D8"
            />
          }
        >
          {/* ================================================= */}
          {/* STUDENT CARD */}
          {/* ================================================= */}

          <View style={styles.studentCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {student.name
                  ?.charAt(0)
                  ?.toUpperCase() || "S"}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.studentName}>
                {student.name}
              </Text>

              <Text
                style={styles.studentDetails}
              >
                Class {student.className} -{" "}
                {student.section}
                {"  •  "}
                Roll {student.roll}
              </Text>
            </View>
          </View>

          {/* ================================================= */}
          {/* SUMMARY */}
          {/* ================================================= */}

          <View
            style={styles.summaryContainer}
          >
            <View
              style={[
                styles.summaryCard,
                styles.blueCard,
              ]}
            >
              <Text
                style={styles.summaryLabel}
              >
                Monthly Fee
              </Text>

              <Text
                style={styles.summaryAmount}
              >
                ৳
                {totalMonthlyFee.toLocaleString()}
              </Text>
            </View>

            <View
              style={[
                styles.summaryCard,
                styles.redCard,
              ]}
            >
              <Text
                style={styles.summaryLabel}
              >
                Total Due
              </Text>

              <Text
                style={[
                  styles.summaryAmount,
                  styles.redText,
                ]}
              >
                ৳
                {totalDue.toLocaleString()}
              </Text>
            </View>

            <View
              style={[
                styles.summaryCard,
                styles.greenCard,
              ]}
            >
              <Text
                style={styles.summaryLabel}
              >
                Total Paid
              </Text>

              <Text
                style={[
                  styles.summaryAmount,
                  styles.greenText,
                ]}
              >
                ৳
                {totalPaid.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* ================================================= */}
          {/* DEFAULT MONTHLY FEE */}
          {/* ================================================= */}

          <SectionHeader
            title="Default Monthly Fee"
            icon="settings"
          />

          <View style={styles.card}>
            <FeeRow
              title="Tuition Fee"
              amount={
                defaultFees.tutionFee
              }
            />

            <FeeRow
              title="Coaching Fee"
              amount={
                defaultFees.coachingFee
              }
            />

            <FeeRow
              title="Other Monthly Fee"
              amount={
                defaultFees.otherMonthlyFee
              }
            />

            <View style={styles.divider} />

            <FeeRow
              title="Total Monthly Fee"
              amount={totalMonthlyFee}
              bold
            />
          </View>

          {/* ================================================= */}
          {/* MONTHLY FEES */}
          {/* ================================================= */}

          <SectionHeader
            title="Monthly Fees"
            icon="calendar-month"
          />

          {monthlyFees.length === 0 ? (
            <View
              style={styles.emptyCard}
            >
              <MaterialIcons
                name="calendar-month"
                size={30}
                color="#98A2B3"
              />

              <Text
                style={styles.emptyText}
              >
                No monthly fee records found.
              </Text>
            </View>
          ) : (
            monthlyFees.map((fee, index) => (
              <View
                style={styles.feeCard}
                key={
                  fee._id ||
                  fee.monthKey ||
                  `monthly-${index}`
                }
              >
                <View
                  style={styles.feeTopRow}
                >
                  <View
                    style={{ flex: 1 }}
                  >
                    <Text
                      style={
                        styles.feeTitle
                      }
                    >
                      {fee.monthName ||
                        fee.monthKey ||
                        `${fee.month || ""} ${
                          fee.year || ""
                        }`.trim() ||
                        "Monthly Fee"}
                    </Text>

                    <Text
                      style={
                        styles.smallText
                      }
                    >
                      Monthly Fee
                    </Text>
                  </View>

                  <StatusBadge
                    status={fee.status}
                  />
                </View>

                <View
                  style={
                    styles.feeAmountRow
                  }
                >
                  <View>
                    <Text
                      style={
                        styles.smallLabel
                      }
                    >
                      Total
                    </Text>

                    <Text
                      style={
                        styles.amountText
                      }
                    >
                      ৳
                      {Number(
                        fee.totalFee || 0
                      ).toLocaleString()}
                    </Text>
                  </View>

                  <View>
                    <Text
                      style={
                        styles.smallLabel
                      }
                    >
                      Paid
                    </Text>

                    <Text
                      style={[
                        styles.amountText,
                        styles.greenText,
                      ]}
                    >
                      ৳
                      {Number(
                        fee.paidAmount || 0
                      ).toLocaleString()}
                    </Text>
                  </View>

                  <View>
                    <Text
                      style={
                        styles.smallLabel
                      }
                    >
                      Due
                    </Text>

                    <Text
                      style={[
                        styles.amountText,
                        styles.redText,
                      ]}
                    >
                      ৳
                      {Number(
                        fee.dueAmount || 0
                      ).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}

          {/* ================================================= */}
          {/* OTHER FEES */}
          {/* ================================================= */}

          <SectionHeader
            title="Other Fees"
            icon="receipt-long"
            actionText="+ Add"
            onAction={() =>
              setShowOtherFeeModal(true)
            }
          />

          {otherFees.length === 0 ? (
            <View
              style={styles.emptyCard}
            >
              <MaterialIcons
                name="receipt-long"
                size={30}
                color="#98A2B3"
              />

              <Text
                style={styles.emptyText}
              >
                No other fees added.
              </Text>
            </View>
          ) : (
            otherFees.map((fee, index) => (
              <View
                style={styles.feeCard}
                key={
                  fee._id ||
                  `other-${index}`
                }
              >
                <View
                  style={styles.feeTopRow}
                >
                  <View
                    style={
                      styles.otherFeeIcon
                    }
                  >
                    <MaterialIcons
                      name="receipt"
                      size={20}
                      color="#0866D8"
                    />
                  </View>

                  <View
                    style={{ flex: 1 }}
                  >
                    <Text
                      style={
                        styles.feeTitle
                      }
                    >
                      {fee.title ||
                        "Other Fee"}
                    </Text>

                    <Text
                      style={
                        styles.smallText
                      }
                    >
                      {(
                        fee.feeType ||
                        "other"
                      )
                        .toString()
                        .toUpperCase()}
                    </Text>
                  </View>

                  <StatusBadge
                    status={fee.status}
                  />
                </View>

                <View
                  style={
                    styles.feeAmountRow
                  }
                >
                  <View>
                    <Text
                      style={
                        styles.smallLabel
                      }
                    >
                      Amount
                    </Text>

                    <Text
                      style={
                        styles.amountText
                      }
                    >
                      ৳
                      {Number(
                        fee.amount || 0
                      ).toLocaleString()}
                    </Text>
                  </View>

                  <View>
                    <Text
                      style={
                        styles.smallLabel
                      }
                    >
                      Paid
                    </Text>

                    <Text
                      style={[
                        styles.amountText,
                        styles.greenText,
                      ]}
                    >
                      ৳
                      {Number(
                        fee.paidAmount || 0
                      ).toLocaleString()}
                    </Text>
                  </View>

                  <View>
                    <Text
                      style={
                        styles.smallLabel
                      }
                    >
                      Due
                    </Text>

                    <Text
                      style={[
                        styles.amountText,
                        styles.redText,
                      ]}
                    >
                      ৳
                      {Number(
                        fee.dueAmount || 0
                      ).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}

          {/* ================================================= */}
          {/* PAYMENT HISTORY */}
          {/* ================================================= */}

          <SectionHeader
            title="Payment History"
            icon="history"
          />

          {paymentHistory.length === 0 ? (
            <View
              style={
                styles.emptyHistoryCard
              }
            >
              <MaterialIcons
                name="receipt-long"
                size={28}
                color="#98A2B3"
              />

              <Text
                style={
                  styles.emptyHistoryText
                }
              >
                No payments recorded yet.
              </Text>
            </View>
          ) : (
            paymentHistory.map(
              (payment, index) => (
                <View
                  key={
                    payment._id ||
                    payment.receiptNumber ||
                    index
                  }
                  style={
                    styles.historyCard
                  }
                >
                  <View
                    style={
                      styles.historyTopRow
                    }
                  >
                    <View
                      style={{ flex: 1 }}
                    >
                      <Text
                        style={
                          styles.feeTitle
                        }
                      >
                        {payment.receiptNumber ||
                          `Payment #${
                            index + 1
                          }`}
                      </Text>

                      <Text
                        style={
                          styles.smallText
                        }
                      >
                        {payment.paymentDate
                          ? new Date(
                              payment.paymentDate
                            ).toLocaleDateString()
                          : "Date unavailable"}
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.historyAmount
                      }
                    >
                      ৳
                      {Number(
                        payment.amount || 0
                      ).toLocaleString()}
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.historyMethod
                    }
                  >
                    {(
                      payment.paymentMethod ||
                      "cash"
                    )
                      .replace(
                        "_",
                        " "
                      )
                      .toUpperCase()}
                  </Text>
                </View>
              )
            )
          )}

          {/* ================================================= */}
          {/* TOTAL PAYABLE */}
          {/* ================================================= */}

          <View
            style={styles.payableCard}
          >
            <View>
              <Text
                style={styles.payableLabel}
              >
                Total Payable
              </Text>

              <Text
                style={styles.payableSub}
              >
                Monthly + Other Fees
              </Text>
            </View>

            <Text
              style={styles.payableAmount}
            >
              ৳
              {totalDue.toLocaleString()}
            </Text>
          </View>

          {/* ================================================= */}
          {/* COLLECT PAYMENT BUTTON */}
          {/* ================================================= */}

          <TouchableOpacity
            style={styles.collectButton}
            onPress={() =>
              setShowPaymentModal(true)
            }
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="payments"
              size={23}
              color="#fff"
            />

            <Text
              style={
                styles.collectButtonText
              }
            >
              Collect Payment
            </Text>
          </TouchableOpacity>

          <View
            style={{ height: 40 }}
          />
        </ScrollView>
      )}

      {/* ================================================= */}
      {/* PAYMENT MODAL */}
      {/* ================================================= */}

      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent
        onRequestClose={() =>
          setShowPaymentModal(false)
        }
      >
        <View
          style={styles.modalOverlay}
        >
          <View
            style={styles.modalContainer}
          >
            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
              keyboardShouldPersistTaps="handled"
            >
              <View
                style={styles.modalHeader}
              >
                <Text
                  style={styles.modalTitle}
                >
                  Collect Payment
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    setShowPaymentModal(
                      false
                    )
                  }
                >
                  <Ionicons
                    name="close"
                    size={25}
                    color="#333"
                  />
                </TouchableOpacity>
              </View>

              <Text
                style={styles.modalStudent}
              >
                {student.name}
              </Text>

              <View
                style={
                  styles.payableModalCard
                }
              >
                <Text
                  style={
                    styles.modalSmallText
                  }
                >
                  Total Due
                </Text>

                <Text
                  style={
                    styles.modalDueAmount
                  }
                >
                  ৳
                  {totalDue.toLocaleString()}
                </Text>
              </View>

              {/* Payment Amount */}

              <Text
                style={styles.inputLabel}
              >
                Payment Amount
              </Text>

              <View
                style={
                  styles.amountInputContainer
                }
              >
                <Text
                  style={styles.currency}
                >
                  ৳
                </Text>

                <TextInput
                  style={styles.amountInput}
                  value={paymentAmount}
                  onChangeText={
                    setPaymentAmount
                  }
                  keyboardType="numeric"
                  placeholder="Enter amount"
                  placeholderTextColor="#98A2B3"
                />
              </View>

              {/* Payment Method */}

              <Text
                style={styles.inputLabel}
              >
                Payment Method
              </Text>

              <View
                style={
                  styles.methodsContainer
                }
              >
                {[
                  [
                    "cash",
                    "Cash",
                    "payments",
                  ],
                  [
                    "bkash",
                    "bKash",
                    "phone-android",
                  ],
                  [
                    "nagad",
                    "Nagad",
                    "phone-android",
                  ],
                  [
                    "bank_transfer",
                    "Bank",
                    "account-balance",
                  ],
                ].map(
                  ([
                    value,
                    title,
                    icon,
                  ]) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.methodButton,
                        paymentMethod ===
                          value &&
                          styles.methodButtonActive,
                      ]}
                      onPress={() =>
                        setPaymentMethod(
                          value
                        )
                      }
                      activeOpacity={0.7}
                    >
                      <MaterialIcons
                        name={icon}
                        size={20}
                        color={
                          paymentMethod ===
                          value
                            ? "#0866D8"
                            : "#777"
                        }
                      />

                      <Text
                        style={[
                          styles.methodText,
                          paymentMethod ===
                            value &&
                            styles.methodTextActive,
                        ]}
                      >
                        {title}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              {/* Allocation */}

              {paymentAllocation.length >
                0 && (
                <>
                  <Text
                    style={
                      styles.allocationTitle
                    }
                  >
                    Payment Allocation
                  </Text>

                  <View
                    style={
                      styles.allocationCard
                    }
                  >
                    {paymentAllocation.map(
                      (
                        item,
                        index
                      ) => (
                        <View
                          key={`${item.id}-${index}`}
                          style={
                            styles.allocationRow
                          }
                        >
                          <Text
                            style={
                              styles.allocationName
                            }
                          >
                            {item.title}
                          </Text>

                          <Text
                            style={
                              styles.allocationAmount
                            }
                          >
                            ৳
                            {Number(
                              item.amount ||
                                0
                            ).toLocaleString()}
                          </Text>
                        </View>
                      )
                    )}
                  </View>
                </>
              )}

              {/* Save */}

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  saving &&
                    styles.disabledButton,
                ]}
                onPress={
                  handleCollectPayment
                }
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator
                    color="#fff"
                  />
                ) : (
                  <>
                    <MaterialIcons
                      name="check-circle"
                      size={22}
                      color="#fff"
                    />

                    <Text
                      style={
                        styles.confirmButtonText
                      }
                    >
                      Confirm Payment
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View
                style={{ height: 15 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* ADD OTHER FEE MODAL */}
      {/* ================================================= */}

      <Modal
        visible={showOtherFeeModal}
        animationType="slide"
        transparent
        onRequestClose={() =>
          setShowOtherFeeModal(false)
        }
      >
        <View
          style={styles.modalOverlay}
        >
          <View
            style={styles.modalContainer}
          >
            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
              keyboardShouldPersistTaps="handled"
            >
              <View
                style={styles.modalHeader}
              >
                <Text
                  style={styles.modalTitle}
                >
                  Add Other Fee
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    setShowOtherFeeModal(
                      false
                    )
                  }
                >
                  <Ionicons
                    name="close"
                    size={25}
                    color="#333"
                  />
                </TouchableOpacity>
              </View>

              {/* Fee Type */}

              <Text
                style={styles.inputLabel}
              >
                Fee Type
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
              >
                {[
                  ["exam", "Exam"],
                  [
                    "admission",
                    "Admission",
                  ],
                  [
                    "registration",
                    "Registration",
                  ],
                  ["fine", "Fine"],
                  ["other", "Other"],
                ].map(
                  ([
                    value,
                    title,
                  ]) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.typeButton,
                        newOtherFee.feeType ===
                          value &&
                          styles.typeButtonActive,
                      ]}
                      onPress={() =>
                        setNewOtherFee(
                          (prev) => ({
                            ...prev,
                            feeType:
                              value,
                          })
                        )
                      }
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.typeText,
                          newOtherFee.feeType ===
                            value &&
                            styles.typeTextActive,
                        ]}
                      >
                        {title}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>

              {/* Fee Title */}

              <Text
                style={styles.inputLabel}
              >
                Fee Title
              </Text>

              <TextInput
                style={styles.textInput}
                value={
                  newOtherFee.title
                }
                onChangeText={(text) =>
                  setNewOtherFee(
                    (prev) => ({
                      ...prev,
                      title: text,
                    })
                  )
                }
                placeholder="e.g. Half Yearly Exam Fee"
                placeholderTextColor="#98A2B3"
              />

              {/* Amount */}

              <Text
                style={styles.inputLabel}
              >
                Amount
              </Text>

              <View
                style={
                  styles.amountInputContainer
                }
              >
                <Text
                  style={styles.currency}
                >
                  ৳
                </Text>

                <TextInput
                  style={styles.amountInput}
                  value={
                    newOtherFee.amount
                  }
                  onChangeText={(text) =>
                    setNewOtherFee(
                      (prev) => ({
                        ...prev,
                        amount: text,
                      })
                    )
                  }
                  keyboardType="numeric"
                  placeholder="Enter amount"
                  placeholderTextColor="#98A2B3"
                />
              </View>

              {/* Add Fee */}

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  saving &&
                    styles.disabledButton,
                ]}
                onPress={
                  handleAddOtherFee
                }
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator
                    color="#fff"
                  />
                ) : (
                  <>
                    <MaterialIcons
                      name="save"
                      size={22}
                      color="#fff"
                    />

                    <Text
                      style={
                        styles.confirmButtonText
                      }
                    >
                      Add Fee
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View
                style={{ height: 15 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// =====================================================
// REUSABLE COMPONENTS
// =====================================================

const SectionHeader = ({
  title,
  icon,
  actionText,
  onAction,
}) => {
  return (
    <View style={styles.sectionHeader}>
      <View
        style={
          styles.sectionTitleContainer
        }
      >
        <MaterialIcons
          name={icon}
          size={21}
          color="#0866D8"
        />

        <Text
          style={styles.sectionTitle}
        >
          {title}
        </Text>
      </View>

      {actionText && (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.7}
        >
          <Text
            style={styles.actionText}
          >
            {actionText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// =====================================================

const FeeRow = ({
  title,
  amount,
  bold = false,
}) => {
  return (
    <View style={styles.feeRow}>
      <Text
        style={[
          styles.feeRowTitle,
          bold && styles.boldText,
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.feeRowAmount,
          bold && styles.boldText,
        ]}
      >
        ৳
        {Number(
          amount || 0
        ).toLocaleString()}
      </Text>
    </View>
  );
};

// =====================================================

const StatusBadge = ({
  status,
}) => {
  let label = "Unpaid";
  let style = styles.unpaidBadge;
  let textStyle = styles.unpaidText;

  if (status === "paid") {
    label = "Paid";
    style = styles.paidBadge;
    textStyle = styles.paidText;
  }

  if (status === "partial") {
    label = "Partial";
    style = styles.partialBadge;
    textStyle = styles.partialText;
  }

  return (
    <View
      style={[
        styles.statusBadge,
        style,
      ]}
    >
      <Text
        style={[
          styles.statusText,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F8FC",
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    height: 90,
    backgroundColor: "#0866D8",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  backButton: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 5,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },

  headerSubtitle: {
    color: "#D8E9FF",
    fontSize: 12,
    marginTop: 2,
  },

  headerAddButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor:
      "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },

  // ===================================================
  // CONTENT
  // ===================================================

  scrollContent: {
    padding: 16,
  },

  studentCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    elevation: 2,
  },

  avatar: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#DDEEFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },

  avatarText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0866D8",
  },

  studentName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#172B4D",
  },

  studentDetails: {
    fontSize: 13,
    color: "#718096",
    marginTop: 5,
  },

  // ===================================================
  // SUMMARY
  // ===================================================

  summaryContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },

  summaryCard: {
    flex: 1,
    borderRadius: 13,
    padding: 12,
  },

  blueCard: {
    backgroundColor: "#EAF3FF",
  },

  redCard: {
    backgroundColor: "#FFF0F0",
  },

  greenCard: {
    backgroundColor: "#EAF9F0",
  },

  summaryLabel: {
    fontSize: 11,
    color: "#65758B",
    marginBottom: 6,
  },

  summaryAmount: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0866D8",
  },

  redText: {
    color: "#E53935",
  },

  greenText: {
    color: "#159957",
  },

  // ===================================================
  // SECTION
  // ===================================================

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 4,
  },

  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1D3557",
  },

  actionText: {
    color: "#0866D8",
    fontSize: 13,
    fontWeight: "700",
  },

  // ===================================================
  // DEFAULT FEE CARD
  // ===================================================

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },

  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },

  feeRowTitle: {
    color: "#667085",
    fontSize: 14,
  },

  feeRowAmount: {
    color: "#172B4D",
    fontSize: 14,
    fontWeight: "600",
  },

  boldText: {
    fontWeight: "800",
    color: "#172B4D",
  },

  divider: {
    height: 1,
    backgroundColor: "#E7ECF2",
    marginVertical: 5,
  },

  // ===================================================
  // FEE CARD
  // ===================================================

  feeCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
  },

  feeTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  feeTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#172B4D",
  },

  smallText: {
    fontSize: 11,
    color: "#8A96A8",
    marginTop: 3,
  },

  feeAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEF1F5",
  },

  smallLabel: {
    fontSize: 11,
    color: "#8A96A8",
    marginBottom: 4,
  },

  amountText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#172B4D",
  },

  // ===================================================
  // STATUS
  // ===================================================

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },

  paidBadge: {
    backgroundColor: "#DDF7E9",
  },

  paidText: {
    color: "#159957",
  },

  partialBadge: {
    backgroundColor: "#FFF0C7",
  },

  partialText: {
    color: "#C17A00",
  },

  unpaidBadge: {
    backgroundColor: "#FFE2E2",
  },

  unpaidText: {
    color: "#D92D20",
  },

  // ===================================================
  // OTHER FEE
  // ===================================================

  otherFeeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EAF3FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  // ===================================================
  // EMPTY
  // ===================================================

  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    marginBottom: 14,
  },

  emptyText: {
    marginTop: 8,
    color: "#8A96A8",
    fontSize: 13,
  },

  emptyHistoryCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    marginBottom: 14,
  },

  emptyHistoryText: {
    marginTop: 8,
    color: "#8A96A8",
    fontSize: 13,
  },

  // ===================================================
  // PAYMENT HISTORY
  // ===================================================

  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
  },

  historyTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  historyAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#159957",
  },

  historyMethod: {
    marginTop: 8,
    fontSize: 10,
    color: "#667085",
    fontWeight: "700",
  },

  // ===================================================
  // PAYABLE
  // ===================================================

  payableCard: {
    backgroundColor: "#EAF3FF",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 15,
  },

  payableLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0866D8",
  },

  payableSub: {
    fontSize: 11,
    color: "#6C7A91",
    marginTop: 3,
  },

  payableAmount: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0866D8",
  },

  // ===================================================
  // COLLECT BUTTON
  // ===================================================

  collectButton: {
    height: 54,
    backgroundColor: "#0866D8",
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  collectButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },

  // ===================================================
  // LOADING
  // ===================================================

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  loadingText: {
    marginTop: 12,
    color: "#667085",
    fontSize: 14,
  },

  // ===================================================
  // MODAL
  // ===================================================

  modalOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    maxHeight: "90%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#172B4D",
  },

  modalStudent: {
    fontSize: 14,
    color: "#667085",
    marginBottom: 15,
  },

  payableModalCard: {
    backgroundColor: "#EAF3FF",
    padding: 15,
    borderRadius: 13,
    marginBottom: 16,
  },

  modalSmallText: {
    fontSize: 12,
    color: "#65758B",
  },

  modalDueAmount: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0866D8",
    marginTop: 3,
  },

  // ===================================================
  // INPUT
  // ===================================================

  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#344054",
    marginBottom: 7,
    marginTop: 8,
  },

  amountInputContainer: {
    height: 52,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },

  currency: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0866D8",
    marginRight: 8,
  },

  amountInput: {
    flex: 1,
    fontSize: 17,
    color: "#172B4D",
  },

  textInput: {
    height: 50,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 11,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#172B4D",
  },

  // ===================================================
  // PAYMENT METHODS
  // ===================================================

  methodsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  methodButton: {
    width: "48%",
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#E0E5EC",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },

  methodButtonActive: {
    borderColor: "#0866D8",
    backgroundColor: "#EAF3FF",
  },

  methodText: {
    fontSize: 13,
    color: "#667085",
    fontWeight: "600",
  },

  methodTextActive: {
    color: "#0866D8",
  },

  // ===================================================
  // ALLOCATION
  // ===================================================

  allocationTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#344054",
    marginTop: 17,
    marginBottom: 7,
  },

  allocationCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
  },

  allocationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#E9EDF2",
  },

  allocationName: {
    flex: 1,
    fontSize: 13,
    color: "#475467",
    marginRight: 10,
  },

  allocationAmount: {
    fontSize: 13,
    fontWeight: "800",
    color: "#159957",
  },

  // ===================================================
  // CONFIRM BUTTON
  // ===================================================

  confirmButton: {
    height: 53,
    backgroundColor: "#0866D8",
    borderRadius: 12,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  disabledButton: {
    opacity: 0.6,
  },

  confirmButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },

  // ===================================================
  // OTHER FEE TYPE
  // ===================================================

  typeButton: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 20,
    marginRight: 7,
  },

  typeButtonActive: {
    backgroundColor: "#EAF3FF",
    borderColor: "#0866D8",
  },

  typeText: {
    fontSize: 12,
    color: "#667085",
    fontWeight: "600",
  },

  typeTextActive: {
    color: "#0866D8",
  },
});

export default FeeCollectionScreen;