import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

export async function pickProfilePhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Permite el acceso a tus fotos para elegir una imagen.');
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });
  if (result.canceled || !result.assets[0]) return null;
  const resized = await ImageManipulator.manipulateAsync(
    result.assets[0].uri,
    [{ resize: { width: 240, height: 240 } }],
    { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  if (!resized.base64) throw new Error('No se pudo procesar la imagen seleccionada.');
  return `data:image/jpeg;base64,${resized.base64}`;
}
