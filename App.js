import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Switch,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  Modal,
  StatusBar,
  Linking
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

// ============================================================
// CONFIGURACIÓN
// ============================================================

const API_URL = 'http://192.168.165.6:8000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================================
// TEMA
// ============================================================

const ThemeContext = createContext();

const lightTheme = {
  bg: '#F5F7FB',
  card: '#FFFFFF',
  input: '#F8FAFC',
  text: '#0F172A',
  subText: '#64748B',
  border: '#E2E8F0',
  primary: '#2563EB',
  primaryLight: '#EFF6FF',
  secondary: '#0EA5E9',
  success: '#16A34A',
  successLight: '#F0FDF4',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  purple: '#7C3AED',
  purpleLight: '#F5F3FF',
  shadow: '#000000'
};

const darkTheme = {
  bg: '#0B1120',
  card: '#111827',
  input: '#1F2937',
  text: '#F8FAFC',
  subText: '#94A3B8',
  border: '#263244',
  primary: '#3B82F6',
  primaryLight: '#172554',
  secondary: '#38BDF8',
  success: '#22C55E',
  successLight: '#052E16',
  danger: '#EF4444',
  dangerLight: '#450A0A',
  warning: '#F59E0B',
  warningLight: '#451A03',
  purple: '#A78BFA',
  purpleLight: '#2E1065',
  shadow: '#000000'
};

// ============================================================
// APP
// ============================================================

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppState();
  }, []);

  const loadAppState = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('token');
      const savedUserData = await AsyncStorage.getItem('user_data');
      const savedTheme = await AsyncStorage.getItem('theme_mode');

      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      }

      if (savedToken && savedUserData) {
        setUser(JSON.parse(savedUserData));
      }
    } catch (e) {
      console.error('Error al cargar datos locales:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = async (value) => {
    setIsDarkMode(value);
    await AsyncStorage.setItem('theme_mode', JSON.stringify(value));
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  if (loading) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: theme.bg }]}>
        <View style={[styles.loadingLogo, { backgroundColor: theme.primary }]}>
          <Text style={styles.loadingLogoText}>+</Text>
        </View>
        <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 20 }} />
        <Text style={[styles.loadingText, { color: theme.subText }]}>
          Cargando aplicación...
        </Text>
      </View>
    );
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, theme }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {!user ? (
          <LoginScreen setUser={setUser} />
        ) : (
          <MainNavigator user={user} setUser={setUser} />
        )}
      </View>
    </ThemeContext.Provider>
  );
}

// ============================================================
// LOGIN
// ============================================================

function LoginScreen({ setUser }) {
  const { theme } = useContext(ThemeContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Datos incompletos', 'Ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.append('username', email.trim());
      params.append('password', password);

      const response = await api.post('/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const { access_token } = response.data;
      const userData = { email: email.trim() };

      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));

      setUser(userData);
    } catch (error) {
      console.error('Error login:', error?.response?.data || error.message);
      if (!error.response) {
        Alert.alert('Sin conexión', 'No se pudo conectar con el servidor.');
      } else {
        Alert.alert('Inicio de sesión', error?.response?.data?.detail || 'Las credenciales son incorrectas.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.loginContainer, { backgroundColor: theme.bg }]}>
      <View style={[styles.loginCard, { backgroundColor: theme.card }]}>
        <Text style={[styles.loginTitle, { color: theme.text }]}>Sistema Médico</Text>
        <Text style={[styles.loginSubtitle, { color: theme.subText }]}>Gestión médica simple y profesional</Text>

        <View style={styles.fieldContainer}>
          <Text style={[styles.fieldLabel, { color: theme.text }]}>Correo electrónico</Text>
          <TextInput
            style={[styles.modernInput, { color: theme.text, backgroundColor: theme.input, borderColor: theme.border }]}
            placeholder="correo@ejemplo.com"
            placeholderTextColor={theme.subText}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={[styles.fieldLabel, { color: theme.text }]}>Contraseña</Text>
          <TextInput
            style={[styles.modernInput, { color: theme.text, backgroundColor: theme.input, borderColor: theme.border }]}
            placeholder="••••••••"
            placeholderTextColor={theme.subText}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Iniciar sesión</Text>}
        </TouchableOpacity>

        <Text style={[styles.loginFooter, { color: theme.subText }]}>Sistema de gestión de pacientes</Text>
      </View>
    </View>
  );
}

// ============================================================
// NAVEGACIÓN
// ============================================================

function MainNavigator({ user, setUser }) {
  const { theme } = useContext(ThemeContext);
  const [screen, setScreen] = useState('Pacientes');
  const [selectedPaciente, setSelectedPaciente] = useState(null);

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user_data');
    setUser(null);
  };

  return (
    <View style={[styles.appContent, { backgroundColor: theme.bg }]}>
      <View style={styles.mainContent}>
        {screen === 'Pacientes' && (
          <PacientesScreen
            onSelectPaciente={(paciente) => {
              setSelectedPaciente(paciente);
              setScreen('Ficha');
            }}
            onGoSettings={() => setScreen('Settings')}
          />
        )}

        {screen === 'Ficha' && (
          <FichaScreen
            paciente={selectedPaciente}
            onBack={() => setScreen('Pacientes')}
            onGoSettings={() => setScreen('Settings')}
          />
        )}

        {screen === 'Settings' && (
          <SettingsScreen user={user} onBack={() => setScreen('Pacientes')} onLogout={logout} />
        )}
      </View>

      <View style={[styles.bottomBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <BottomTab icon="⌂" label="Pacientes" active={screen === 'Pacientes'} theme={theme} onPress={() => setScreen('Pacientes')} />
        <BottomTab icon="⚙" label="Ajustes" active={screen === 'Settings'} theme={theme} onPress={() => setScreen('Settings')} />
      </View>
    </View>
  );
}

function BottomTab({ icon, label, active, theme, onPress }) {
  return (
    <TouchableOpacity style={styles.bottomTab} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.bottomIcon, { color: active ? theme.primary : theme.subText }]}>{icon}</Text>
      <Text style={[styles.bottomLabel, { color: active ? theme.primary : theme.subText }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ============================================================
// PACIENTES
// ============================================================

function PacientesScreen({ onSelectPaciente, onGoSettings }) {
  const { theme } = useContext(ThemeContext);
  const [pacientes, setPacientes] = useState([]);
  const [search, setSearch] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarPacientes();
  }, [search]);

  const cargarPacientes = async () => {
    try {
      const res = await api.get(`/pacientes?search=${encodeURIComponent(search)}`);
      setPacientes(res.data);
    } catch (e) {
      console.log('Error al cargar pacientes', e);
    }
  };

  const abrirNuevoPaciente = () => {
    setNombre('');
    setTelefono('');
    setEditingId(null);
    setShowModal(true);
  };

  const abrirEditar = (paciente) => {
    setEditingId(paciente.id);
    setNombre(paciente.nombre);
    setTelefono(paciente.telefono || '');
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setNombre('');
    setTelefono('');
    setEditingId(null);
  };

  const guardarPaciente = async () => {
    if (!nombre.trim()) {
      Alert.alert('Dato requerido', 'Ingresa el nombre del paciente.');
      return;
    }

    setLoading(true);

    try {
      if (editingId) {
        await api.put(`/pacientes/${editingId}`, { nombre: nombre.trim(), telefono: telefono.trim() });
      } else {
        await api.post('/pacientes', { nombre: nombre.trim(), telefono: telefono.trim() });
      }

      cerrarModal();
      cargarPacientes();
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el paciente.');
    } finally {
      setLoading(false);
    }
  };

  const borrarPaciente = (id) => {
    Alert.alert('Eliminar paciente', '¿Estás seguro de que deseas eliminar este paciente?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/pacientes/${id}`);
            cargarPacientes();
          } catch (e) {
            Alert.alert('Error', 'No se pudo eliminar el paciente.');
          }
        }
      }
    ]);
  };

  const getInitials = (nombrePaciente) => {
    if (!nombrePaciente) return '?';
    return nombrePaciente.split(' ').slice(0, 2).map(w => w.charAt(0)).join('').toUpperCase();
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <View style={styles.pageHeader}>
        <View>
          <Text style={[styles.pageTitle, { color: theme.text }]}>Pacientes</Text>
          <Text style={[styles.pageSubtitle, { color: theme.subText }]}>Gestiona tus pacientes</Text>
        </View>
        <TouchableOpacity style={[styles.headerIcon, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={onGoSettings}>
          <Text style={[styles.headerIconText, { color: theme.text }]}>⚙</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.searchIcon, { color: theme.subText }]}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Buscar paciente..."
          placeholderTextColor={theme.subText}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.patientCountRow}>
        <Text style={[styles.patientCount, { color: theme.text }]}>
          {pacientes.length} paciente{pacientes.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={pacientes}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.primaryLight }]}>
              <Text>👤</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No hay pacientes</Text>
            <Text style={[styles.emptyText, { color: theme.subText }]}>Agrega tu primer paciente para comenzar.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <PatientCard
            paciente={item}
            theme={theme}
            initials={getInitials(item.nombre)}
            onPress={() => onSelectPaciente(item)}
            onEdit={() => abrirEditar(item)}
            onDelete={() => borrarPaciente(item.id)}
          />
        )}
      />

      <TouchableOpacity style={[styles.fab, { backgroundColor: theme.primary }]} onPress={abrirNuevoPaciente} activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={cerrarModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>{editingId ? 'Editar paciente' : 'Nuevo paciente'}</Text>
                <Text style={[styles.modalSubtitle, { color: theme.subText }]}>Información básica</Text>
              </View>
              <TouchableOpacity onPress={cerrarModal}>
                <Text style={[styles.closeButton, { color: theme.subText }]}>×</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.fieldLabel, { color: theme.text }]}>Nombre completo</Text>
            <TextInput
              style={[styles.modernInput, { color: theme.text, backgroundColor: theme.input, borderColor: theme.border }]}
              placeholder="Ingrese Nombre completo"
              placeholderTextColor={theme.subText}
              value={nombre}
              onChangeText={setNombre}
            />

            <Text style={[styles.fieldLabel, { color: theme.text }]}>Teléfono</Text>
            <TextInput
              style={[styles.modernInput, { color: theme.text, backgroundColor: theme.input, borderColor: theme.border }]}
              placeholder="Ingrese numero Telefonico"
              placeholderTextColor={theme.subText}
              value={telefono}
              onChangeText={setTelefono}
              keyboardType="phone-pad"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.secondaryButton, { borderColor: theme.border }]} onPress={cerrarModal}>
                <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.primary, flex: 1 }]} onPress={guardarPaciente} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>{editingId ? 'Actualizar' : 'Guardar'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================================
// TARJETA PACIENTE
// ============================================================

function PatientCard({ paciente, theme, initials, onPress, onEdit, onDelete }) {
  return (
    <View style={[styles.patientCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <TouchableOpacity style={styles.patientMain} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
          <Text style={[styles.avatarText, { color: theme.primary }]}>{initials}</Text>
        </View>

        <View style={styles.patientInfo}>
          <Text style={[styles.patientName, { color: theme.text }]}>{paciente.nombre}</Text>
          <Text style={[styles.patientPhone, { color: theme.subText }]}>{paciente.telefono || 'Sin teléfono registrado'}</Text>
        </View>

        <Text style={[styles.arrow, { color: theme.subText }]}>›</Text>
      </TouchableOpacity>

      <View style={[styles.cardDivider, { backgroundColor: theme.border }]} />

      <View style={styles.cardActions}>
        <TouchableOpacity onPress={onPress} style={styles.viewButton}>
          <Text style={[styles.viewButtonText, { color: theme.primary }]}>Ver ficha</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onEdit} style={[styles.smallAction, { backgroundColor: theme.warningLight }]}>
          <Text style={{ color: theme.warning, fontWeight: '700' }}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onDelete} style={[styles.smallAction, { backgroundColor: theme.dangerLight }]}>
          <Text style={{ color: theme.danger, fontWeight: '700' }}>Borrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================
// FICHA MÉDICA
// ============================================================

function FichaScreen({ paciente, onBack, onGoSettings }) {
  const { theme } = useContext(ThemeContext);

  const [activeTab, setActiveTab] = useState('Resumen');
  const [citas, setCitas] = useState([]);
  const [expedientes, setExpedientes] = useState([]);

  const [doctor, setDoctor] = useState('Dr. General');
  const [motivo, setMotivo] = useState('Consulta de Seguimiento');
  const [fechaCita, setFechaCita] = useState(new Date());

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [peso, setPeso] = useState('');
  const [presion, setPresion] = useState('');
  const [notas, setNotas] = useState('');
  const [foto, setFoto] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const resCitas = await api.get('/citas');
      const citasData = Array.isArray(resCitas.data) ? resCitas.data : [];
      const citasDelPaciente = citasData.filter(c => Number(c.paciente_id) === Number(paciente.id));
      setCitas(citasDelPaciente);

      const resExp = await api.get(`/expedientes/${paciente.id}`);
      const expedientesData = Array.isArray(resExp.data) ? resExp.data : [];
      const expedientesOrdenados = [...expedientesData].sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0));

      setExpedientes(expedientesOrdenados);
    } catch (e) {
      console.error('ERROR AL CARGAR FICHA:', e?.response?.data || e.message || e);
    }
  };

  const agendarCita = async () => {
    const doctorLimpio = String(doctor ?? '').trim();
    const motivoLimpio = String(motivo ?? '').trim();

    if (!doctorLimpio) {
      Alert.alert('Dato requerido', 'Ingresa el nombre del doctor.');
      return;
    }
    if (!motivoLimpio) {
      Alert.alert('Dato requerido', 'Ingresa el motivo de la consulta.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/citas', {
        paciente_id: paciente.id,
        doctor: doctorLimpio,
        motivo: motivoLimpio,
        fecha_hora: fechaCita.toISOString()
      });

      Alert.alert('Cita agendada', 'La cita se guardó correctamente.');
      await cargarDatos();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'No se pudo agendar la cita.');
    } finally {
      setSaving(false);
    }
  };

  const guardarExpediente = async () => {
    // CORRECCIÓN 1: Permite cualquier dato o texto numérico en el campo de presión
    if (!presion.trim()) {
      Alert.alert('Dato requerido', 'Ingresa el valor de la presión.');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('paciente_id', paciente.id);
      formData.append('peso', peso.trim());
      formData.append('presion', presion.trim());
      formData.append('notas', notas.trim());

      if (foto) {
        const filename = foto.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('foto', { uri: foto.uri, name: filename, type });
      }

      await api.post('/expedientes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      Alert.alert('Éxito', 'Registro médico guardado.');
      setPeso('');
      setPresion('');
      setNotas('');
      setFoto(null);
      await cargarDatos();
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el registro.');
    } finally {
      setSaving(false);
    }
  };

  const seleccionarFoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7
      });
      if (!result.canceled) {
        setFoto(result.assets[0]);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo seleccionar la fotografía.');
    }
  };

  // CORRECCIÓN 2: Función de envío por WhatsApp estructurada
  const enviarConfirmacionWhatsApp = (cita) => {
    const telefonoLimpio = paciente.telefono ? paciente.telefono.replace(/\D/g, '') : '';
    
    if (!telefonoLimpio) {
      Alert.alert('Atención', 'El paciente no cuenta con un número telefónico registrado.');
      return;
    }

    const fechaObj = new Date(cita.fecha_hora);
    const fechaFormat = fechaObj.toLocaleDateString('es-ES');
    const horaFormat = fechaObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    const mensaje = `Hola ${paciente.nombre}, le recordamos su cita médica:\n\n` +
                    `👨‍⚕️ *Doctor:* ${cita.doctor || 'Doctor General'}\n` +
                    `📋 *Motivo:* ${cita.motivo}\n` +
                    `📅 *Fecha:* ${fechaFormat}\n` +
                    `⏰ *Hora:* ${horaFormat}\n\n` +
                    `Por favor confirme su asistencia.`;

    const url = `whatsapp://send?phone=${telefonoLimpio}&text=${encodeURIComponent(mensaje)}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Error', 'WhatsApp no se encuentra instalado en este dispositivo.');
        }
      })
      .catch(() => Alert.alert('Error', 'No se pudo abrir WhatsApp.'));
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      {/* HEADER DE FICHA */}
      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: theme.primary }]}>‹ Volver</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.headerIcon, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={onGoSettings}>
          <Text style={[styles.headerIconText, { color: theme.text }]}>⚙</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.patientDetailHeader}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>{paciente.nombre}</Text>
        <Text style={[styles.pageSubtitle, { color: theme.subText }]}>{paciente.telefono || 'Sin teléfono'}</Text>
      </View>

      {/* TABS */}
      <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
        {['Resumen', 'Agendar Cita'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabItem, activeTab === tab && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? theme.primary : theme.subText }]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {activeTab === 'Resumen' ? (
          <View style={{ padding: 16 }}>
            {/* FORMULARIO EXPEDIENTE */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Nuevo Registro Médico</Text>
              
              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Peso (kg)</Text>
                  <TextInput
                    style={[styles.modernInput, { color: theme.text, backgroundColor: theme.input, borderColor: theme.border }]}
                    placeholder="Ej. 70"
                    placeholderTextColor={theme.subText}
                    keyboardType="numeric"
                    value={peso}
                    onChangeText={setPeso}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Presión</Text>
                  <TextInput
                    style={[styles.modernInput, { color: theme.text, backgroundColor: theme.input, borderColor: theme.border }]}
                    placeholder="Ej. 120 o 120/80"
                    placeholderTextColor={theme.subText}
                    value={presion}
                    onChangeText={setPresion}
                  />
                </View>
              </View>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Observaciones</Text>
              <TextInput
                style={[styles.modernInput, styles.textArea, { color: theme.text, backgroundColor: theme.input, borderColor: theme.border }]}
                placeholder="Escribe las observaciones..."
                placeholderTextColor={theme.subText}
                multiline
                numberOfLines={3}
                value={notas}
                onChangeText={setNotas}
              />

              <TouchableOpacity style={[styles.photoButton, { borderColor: theme.primary }]} onPress={seleccionarFoto}>
                <Text style={{ color: theme.primary, fontWeight: '600' }}>
                  {foto ? '✓ Fotografía cargada' : '+ Adjuntar fotografía'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.primary, marginTop: 12 }]}
                onPress={guardarExpediente}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Guardar registro</Text>}
              </TouchableOpacity>
            </View>

            {/* HISTORIAL MÉDICO */}
            <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>Historial médico</Text>
            {expedientes.map((exp) => (
              <View key={exp.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, marginBottom: 12 }]}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Registro médico</Text>
                  <Text style={{ color: theme.subText, fontSize: 12 }}>#{exp.id}</Text>
                </View>
                <View style={styles.rowInputs}>
                  <View style={{ marginRight: 24 }}>
                    <Text style={{ color: theme.subText, fontSize: 12 }}>Peso</Text>
                    <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>{exp.peso ? `${exp.peso} kg` : '-'}</Text>
                  </View>
                  <View>
                    <Text style={{ color: theme.subText, fontSize: 12 }}>Presión</Text>
                    <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>{exp.presion || '-'}</Text>
                  </View>
                </View>
                {exp.notas ? <Text style={[styles.expNotas, { backgroundColor: theme.input, color: theme.text }]}>{exp.notas}</Text> : null}
                {exp.foto_url ? (
                  <Image source={{ uri: `${API_URL}${exp.foto_url}` }} style={styles.expImage} resizeMode="cover" />
                ) : null}
              </View>
            ))}

            {/* LISTA CITAS PROGRAMADAS CON WHATSAPP */}
            <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>Citas programadas</Text>
            {citas.map((cita) => {
              const fechaObj = new Date(cita.fecha_hora);
              const dia = fechaObj.getDate();
              const mes = fechaObj.toLocaleString('es-ES', { month: 'short' }).toUpperCase();
              const hora = fechaObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

              return (
                <View key={cita.id} style={[styles.citaCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={styles.citaContent}>
                    <View style={[styles.dateBadge, { backgroundColor: theme.primaryLight }]}>
                      <Text style={[styles.dateDay, { color: theme.primary }]}>{dia}</Text>
                      <Text style={[styles.dateMonth, { color: theme.primary }]}>{mes}</Text>
                    </View>

                    <View style={styles.citaInfo}>
                      <Text style={[styles.citaMotivo, { color: theme.text }]}>{cita.motivo}</Text>
                      <Text style={[styles.citaDoctor, { color: theme.subText }]}> {cita.doctor || 'Doctor General'}</Text>
                      <Text style={[styles.citaHora, { color: theme.primary }]}>⏰ {hora}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.wsButton, { backgroundColor: theme.success }]}
                    onPress={() => enviarConfirmacionWhatsApp(cita)}
                  >
                    <Text style={styles.wsButtonText}> Confirmar por WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ) : (
          /* PESTAÑA AGENDAR CITA */
          <View style={{ padding: 16 }}>
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Agendar Nueva Cita</Text>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Doctor</Text>
              <TextInput
                style={[styles.modernInput, { color: theme.text, backgroundColor: theme.input, borderColor: theme.border }]}
                value={doctor}
                onChangeText={setDoctor}
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Motivo de consulta</Text>
              <TextInput
                style={[styles.modernInput, { color: theme.text, backgroundColor: theme.input, borderColor: theme.border }]}
                value={motivo}
                onChangeText={setMotivo}
              />

              <View style={{ flexDirection: 'row', marginTop: 10 }}>
                <TouchableOpacity
                  style={[styles.dateTimeBtn, { backgroundColor: theme.input, borderColor: theme.border, marginRight: 5 }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={{ color: theme.text }}>📅 {fechaCita.toLocaleDateString()}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dateTimeBtn, { backgroundColor: theme.input, borderColor: theme.border, marginLeft: 5 }]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={{ color: theme.text }}>⏰ {fechaCita.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={fechaCita}
                  mode="date"
                  display="default"
                  onChange={(e, date) => {
                    setShowDatePicker(false);
                    if (date) setFechaCita(date);
                  }}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={fechaCita}
                  mode="time"
                  display="default"
                  onChange={(e, date) => {
                    setShowTimePicker(false);
                    if (date) setFechaCita(date);
                  }}
                />
              )}

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.primary, marginTop: 20 }]}
                onPress={agendarCita}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Agendar Cita</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ============================================================
// AJUSTES DE CONFIGURACIÓN
// ============================================================

function SettingsScreen({ user, onBack, onLogout }) {
  const { theme, isDarkMode, toggleDarkMode } = useContext(ThemeContext);

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: theme.primary }]}>‹ Volver</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.pageTitle, { color: theme.text, paddingHorizontal: 16 }]}>Ajustes</Text>

      <View style={{ padding: 16 }}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.fieldLabel, { color: theme.subText }]}>Usuario activo</Text>
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }}>{user?.email || 'N/A'}</Text>
        </View>

        <View style={[styles.card, styles.rowBetween, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 12 }]}>
          <Text style={{ color: theme.text, fontWeight: '600' }}>Modo Oscuro</Text>
          <Switch value={isDarkMode} onValueChange={toggleDarkMode} />
        </View>

        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.danger, marginTop: 24 }]} onPress={onLogout}>
          <Text style={styles.primaryButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================
// ESTILOS DE LA APLICACIÓN
// ============================================================

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingLogo: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  loadingLogoText: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
  loadingText: { marginTop: 12, fontSize: 14 },
  
  appContent: { flex: 1 },
  mainContent: { flex: 1 },
  screen: { flex: 1, paddingTop: Platform.OS === 'android' ? 25 : 0 },
  
  loginContainer: { flex: 1, justifyContent: 'center', padding: 20 },
  loginCard: { padding: 24, borderRadius: 16 },
  loginTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  loginSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  loginFooter: { textAlign: 'center', marginTop: 16, fontSize: 12 },

  fieldContainer: { marginBottom: 12 },
  fieldLabel: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  modernInput: { height: 48, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 15 },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: 10 },

  primaryButton: { height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  secondaryButton: { height: 48, borderWidth: 1, borderRadius: 8, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, marginRight: 8 },
  secondaryButtonText: { fontSize: 15, fontWeight: '600' },

  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10 },
  pageTitle: { fontSize: 26, fontWeight: 'bold' },
  pageSubtitle: { fontSize: 14 },
  headerIcon: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  headerIconText: { fontSize: 18 },

  searchContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, marginHorizontal: 16, marginTop: 12, paddingHorizontal: 12, height: 44 },
  searchIcon: { marginRight: 8, fontSize: 16 },
  searchInput: { flex: 1, height: 44 },
  patientCountRow: { paddingHorizontal: 16, marginVertical: 8 },
  patientCount: { fontSize: 13, fontWeight: '600' },

  patientCard: { marginHorizontal: 16, marginBottom: 12, borderRadius: 12, borderWidth: 1, padding: 12 },
  patientMain: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: 'bold' },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 16, fontWeight: 'bold' },
  patientPhone: { fontSize: 13, marginTop: 2 },
  arrow: { fontSize: 20, fontWeight: 'bold' },
  cardDivider: { height: 1, marginVertical: 10 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  viewButton: { marginRight: 'auto' },
  viewButtonText: { fontWeight: 'bold', fontSize: 13 },
  smallAction: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, marginLeft: 8 },

  fab: { position: 'absolute', bottom: 70, right: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabText: { color: '#FFF', fontSize: 28, lineHeight: 28 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalSubtitle: { fontSize: 13 },
  closeButton: { fontSize: 24, fontWeight: 'bold' },
  modalButtons: { flexDirection: 'row', marginTop: 20 },

  bottomBar: { flexDirection: 'row', height: 60, borderTopWidth: 1, position: 'absolute', bottom: 0, left: 0, right: 0 },
  bottomTab: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bottomIcon: { fontSize: 18 },
  bottomLabel: { fontSize: 11, marginTop: 2 },

  backButton: { paddingVertical: 8 },
  backButtonText: { fontSize: 16, fontWeight: '600' },
  patientDetailHeader: { paddingHorizontal: 16, marginVertical: 8 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 16 },
  tabItem: { paddingVertical: 10, marginRight: 20 },
  tabText: { fontSize: 15, fontWeight: 'bold' },

  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  rowInputs: { flexDirection: 'row', marginBottom: 8 },
  photoButton: { borderWidth: 1, borderStyle: 'dashed', height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginVertical: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  expNotas: { padding: 8, borderRadius: 6, marginTop: 8, fontSize: 13 },
  expImage: { width: '100%', height: 150, borderRadius: 8, marginTop: 10 },

  // Tarjetas de Citas y WhatsApp
  citaCard: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  citaContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dateBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', marginRight: 12 },
  dateDay: { fontSize: 18, fontWeight: 'bold' },
  dateMonth: { fontSize: 11, fontWeight: '600' },
  citaInfo: { flex: 1 },
  citaMotivo: { fontSize: 15, fontWeight: 'bold' },
  citaDoctor: { fontSize: 13, marginTop: 2 },
  citaHora: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  wsButton: { paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  wsButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },

  dateTimeBtn: { flex: 1, height: 44, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold' },
  emptyText: { fontSize: 13, textAlign: 'center', marginTop: 4 }
});