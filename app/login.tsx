import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { supabase } from '../lib/supabase';

const EMAIL = 'jmgdeluca@gmail.com';

export default function LoginScreen() {
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: EMAIL,
      options: { shouldCreateUser: true },
    });
    if (error) {
      Alert.alert('Error', 'No se pudo enviar el código. Intentá de nuevo.');
    } else {
      setCodeSent(true);
    }
    setLoading(false);
  };

  const verify = async () => {
    if (code.length < 6) return;
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: EMAIL,
      token: code,
      type: 'email',
    });
    if (error) {
      Alert.alert('Código incorrecto', 'Verificá el código e intentá de nuevo.');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <Image source={require('../assets/images/icon.png')} style={styles.logo} />
        <Text style={styles.title}>Deluca Agencia</Text>
        <Text style={styles.sub}>Acceso privado</Text>

        {!codeSent ? (
          <>
            <Text style={styles.desc}>
              Tocá el botón para recibir un código de acceso en tu mail.
            </Text>
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={sendCode}
              disabled={loading}
            >
              <Ionicons name="mail" size={18} color={Colors.text} />
              <Text style={styles.btnText}>{loading ? 'Enviando...' : 'Enviar código'}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.desc}>
              Ingresá el código de 6 dígitos que llegó a tu mail.
            </Text>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder="000000"
              placeholderTextColor={Colors.subtext}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              textAlign="center"
            />
            <TouchableOpacity
              style={[styles.btn, (loading || code.length < 6) && styles.btnDisabled]}
              onPress={verify}
              disabled={loading || code.length < 6}
            >
              <Ionicons name="lock-open" size={18} color={Colors.text} />
              <Text style={styles.btnText}>{loading ? 'Verificando...' : 'Entrar'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setCodeSent(false); setCode(''); }} style={styles.resend}>
              <Text style={styles.resendText}>Reenviar código</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  logo: { width: 100, height: 100, borderRadius: 24, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  sub: { fontSize: 14, color: Colors.accent, fontWeight: '700', marginBottom: 32, textTransform: 'uppercase', letterSpacing: 1 },
  desc: { fontSize: 15, color: Colors.subtext, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  email: { color: Colors.text, fontWeight: '700' },
  input: {
    width: '100%', backgroundColor: Colors.card, color: Colors.text,
    borderRadius: 14, paddingVertical: 16, fontSize: 28, fontWeight: '800',
    letterSpacing: 8, marginBottom: 16, borderWidth: 1, borderColor: Colors.border,
  },
  btn: {
    width: '100%', backgroundColor: Colors.accent, borderRadius: 14,
    paddingVertical: 16, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: Colors.text, fontWeight: '800', fontSize: 16 },
  resend: { marginTop: 16 },
  resendText: { color: Colors.subtext, fontSize: 14 },
});
