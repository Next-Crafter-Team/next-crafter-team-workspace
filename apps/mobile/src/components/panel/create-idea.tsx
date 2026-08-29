import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Cementerio as C, CementerioFonts as F } from '@/constants/cementerio';
import { CONNECTED_REPOS, GITHUB_CONNECTION, type ConnectedRepo } from '@/data/github-repos';

const CONTENT_TYPES = ['Proyecto', 'Post', 'Video', 'Evento', 'Otro'] as const;
type ContentType = (typeof CONTENT_TYPES)[number];

export function CreateIdea() {
  const [linkedRepo, setLinkedRepo] = useState<ConnectedRepo | null>(null);
  const [repoPickerOpen, setRepoPickerOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<ContentType>('Proyecto');
  const [dateLabel, setDateLabel] = useState('');
  const [whyItDied, setWhyItDied] = useState('');
  const [whatLearned, setWhatLearned] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');

  const pickRepo = (repo: ConnectedRepo) => {
    setLinkedRepo(repo);
    setRepoPickerOpen(false);
    setType('Proyecto');
    if (!title.trim()) {
      // prellena el título con un nombre legible del repo
      const name = repo.fullName.split('/')[1] ?? repo.fullName;
      setTitle(name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
    }
  };

  const unlinkRepo = () => setLinkedRepo(null);

  const canCreate = title.trim().length > 1;

  const create = () => {
    if (!canCreate) {
      Alert.alert('Falta el título', 'Poné al menos un título para crear la idea.');
      return;
    }
    Alert.alert(
      'Crear y enterrar',
      [
        `"${title.trim()}" · ${type} · ${visibility === 'public' ? 'Pública' : 'Privada'}`,
        linkedRepo ? `Repo vinculado: ${linkedRepo.fullName}` : 'Sin repo (idea manual)',
        '',
        linkedRepo
          ? 'Se crea un repository con origin: github y la autopsia que escribiste.'
          : 'Se crea un repository con origin: manual y la autopsia que escribiste.',
      ].join('\n'),
    );
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>CREAR UNA IDEA</Text>
      <Text style={styles.lead}>
        Enterrá algo que dejaste: un repo, un borrador, un evento, una idea que nunca llegó a código.
        No hace falta que sea un proyecto de programación.
      </Text>

      {/* ---- vincular repo (opcional) ---- */}
      <View style={styles.repoBlock}>
        <Text style={styles.blockLabel}>Vincular un repo de GitHub · opcional</Text>

        {linkedRepo ? (
          <View style={styles.linkedCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkedName}>{linkedRepo.fullName}</Text>
              <Text style={styles.linkedMeta}>{linkedRepo.lastActivity}</Text>
            </View>
            <Pressable onPress={unlinkRepo} hitSlop={8}>
              <Text style={styles.unlink}>Quitar</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.linkBtn} onPress={() => setRepoPickerOpen((o) => !o)}>
            <Text style={styles.linkBtnText}>
              {repoPickerOpen ? 'Cerrar lista' : '＋ Elegir de mis repos'}
            </Text>
          </Pressable>
        )}

        {repoPickerOpen && !linkedRepo && (
          <View style={styles.picker}>
            <Text style={styles.pickerHint}>{GITHUB_CONNECTION.login} · {GITHUB_CONNECTION.status}</Text>
            {CONNECTED_REPOS.map((repo) => (
              <Pressable key={repo.id} style={styles.pickerRow} onPress={() => pickRepo(repo)}>
                <View style={{ flex: 1 }}>
                  <View style={styles.pickerNameRow}>
                    <Text style={styles.pickerName}>{repo.fullName}</Text>
                    {repo.private && (
                      <View style={styles.privBadge}>
                        <Text style={styles.privBadgeText}>Privado</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.pickerMeta}>
                    {repo.desc} · {repo.lastActivity}
                  </Text>
                </View>
                <Text style={styles.pickerPick}>Elegir</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* ---- vista previa en vivo ---- */}
      <View style={styles.preview}>
        <Text style={styles.previewTag}>VISTA PREVIA EN EL CEMENTERIO</Text>
        <View style={styles.grave}>
          <Text style={styles.graveRip}>R.I.P.</Text>
        </View>
        <Text style={styles.previewTitle}>{title.trim() || 'Sin título todavía'}</Text>
        <Text style={styles.previewMeta}>
          {linkedRepo ? 'GitHub' : 'Manual'} · {type} ·{' '}
          {visibility === 'public' ? 'pública' : 'privada'}
          {dateLabel.trim() ? ` · ${dateLabel.trim()}` : ''}
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Título</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Ej: Club de cenas temáticas de barrio"
          placeholderTextColor={C.stoneDim}
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Tipo</Text>
        <View style={styles.chipRow}>
          {CONTENT_TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              style={[styles.typeChip, type === t && styles.typeChipOn]}>
              <Text style={[styles.typeChipText, type === t && styles.typeChipTextOn]}>{t}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Fecha aproximada</Text>
        <Text style={styles.hint}>"Marzo 2025" alcanza.</Text>
        <TextInput
          value={dateLabel}
          onChangeText={setDateLabel}
          placeholder="Marzo 2025"
          placeholderTextColor={C.stoneDim}
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Por qué se dejó</Text>
        <Text style={styles.hint}>Se vuelve la autopsia pública si elegís "Público".</Text>
        <TextInput
          value={whyItDied}
          onChangeText={setWhyItDied}
          placeholder="Qué pasó, por qué se abandonó…"
          placeholderTextColor={C.stoneDim}
          multiline
          style={[styles.input, styles.textarea]}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Qué aprendiste</Text>
        <TextInput
          value={whatLearned}
          onChangeText={setWhatLearned}
          placeholder="La lección real, no la genérica…"
          placeholderTextColor={C.stoneDim}
          multiline
          style={[styles.input, styles.textarea]}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Evidencia · opcional</Text>
        <Pressable
          style={styles.dropzone}
          onPress={() =>
            Alert.alert('Evidencia', 'Subiría un link o archivo a Convex Storage (storageId).')
          }>
          <Text style={styles.dropzoneText}>Tocá para adjuntar un link, captura o archivo</Text>
        </Pressable>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Visibilidad</Text>
        <View style={styles.visToggle}>
          <Pressable
            onPress={() => setVisibility('private')}
            style={[styles.visBtn, visibility === 'private' && styles.visBtnPriv]}>
            <Text style={[styles.visText, visibility === 'private' && styles.visTextPriv]}>
              Privado
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setVisibility('public')}
            style={[styles.visBtn, visibility === 'public' && styles.visBtnPub]}>
            <Text style={[styles.visText, visibility === 'public' && styles.visTextPub]}>
              Público
            </Text>
          </Pressable>
        </View>
        <Text style={styles.hint}>
          {visibility === 'public'
            ? 'Autopsia visible para todos. El código nunca se muestra.'
            : 'Solo vos la ves. Alimenta tus recordatorios.'}
        </Text>
      </View>

      <Pressable style={[styles.createBtn, !canCreate && styles.createBtnOff]} onPress={create}>
        <Text style={styles.createText}>Crear y enterrar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 2 },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 0.8,
    color: C.ember,
    fontFamily: F.sans,
    fontWeight: '600',
    marginBottom: 6,
  },
  lead: { fontSize: 12, lineHeight: 18, color: C.stone, fontFamily: F.sans, marginBottom: 16 },

  repoBlock: { marginBottom: 18, gap: 8 },
  blockLabel: { fontSize: 11, color: C.stone, fontFamily: F.sans, fontWeight: '500' },
  linkBtn: {
    borderWidth: 1,
    borderColor: C.line,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
  },
  linkBtnText: { fontSize: 12, color: C.stone, fontFamily: F.sans, fontWeight: '500' },
  linkedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.bgRaised,
    borderWidth: 1,
    borderColor: C.ember,
    borderRadius: 8,
    padding: 12,
  },
  linkedName: { fontFamily: F.mono, fontSize: 12, color: C.bone, fontWeight: '500' },
  linkedMeta: { fontSize: 10, color: C.stoneDim, fontFamily: F.sans, marginTop: 2 },
  unlink: { fontSize: 11, color: C.ember, fontFamily: F.sans, fontWeight: '500' },
  picker: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: C.bgCard,
  },
  pickerHint: {
    fontSize: 9.5,
    color: C.stoneDim,
    fontFamily: F.sans,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  pickerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  pickerName: { fontFamily: F.mono, fontSize: 11.5, color: C.bone },
  privBadge: {
    borderWidth: 1,
    borderColor: C.goldDim,
    borderRadius: 20,
    paddingVertical: 1,
    paddingHorizontal: 6,
  },
  privBadgeText: { fontSize: 8, color: C.gold, fontFamily: F.sans },
  pickerMeta: { fontSize: 10, color: C.stone, fontFamily: F.sans, marginTop: 3 },
  pickerPick: { fontSize: 11, color: C.ember, fontFamily: F.sans, fontWeight: '600' },

  preview: {
    backgroundColor: C.bgCard,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  previewTag: {
    fontSize: 9,
    letterSpacing: 0.5,
    color: C.gold,
    fontFamily: F.sans,
    fontWeight: '600',
    marginBottom: 12,
  },
  grave: {
    height: 92,
    borderRadius: 6,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1,
    borderColor: C.ember,
    backgroundColor: C.emberDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  graveRip: { fontFamily: F.serif, fontSize: 15, color: C.ember, letterSpacing: 1 },
  previewTitle: { fontFamily: F.serif, fontSize: 15, fontWeight: '500', color: C.bone },
  previewMeta: { fontSize: 10.5, color: C.stoneDim, fontFamily: F.sans, marginTop: 4 },

  field: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '500', color: C.bone, fontFamily: F.sans, marginBottom: 6 },
  hint: { fontSize: 10, color: C.stoneDim, fontFamily: F.sans, marginTop: 6 },
  input: {
    backgroundColor: C.bgInput,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    color: C.bone,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 12.5,
    fontFamily: F.sans,
  },
  textarea: { minHeight: 78, textAlignVertical: 'top' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  typeChip: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: C.bgCard,
  },
  typeChipOn: { borderColor: C.ember, backgroundColor: C.emberDim },
  typeChipText: { fontSize: 11, color: C.stone, fontFamily: F.sans },
  typeChipTextOn: { color: C.ember },

  dropzone: {
    borderWidth: 1,
    borderColor: C.stoneDim,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  dropzoneText: { fontSize: 11, color: C.stoneDim, fontFamily: F.sans },

  visToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  visBtn: { paddingVertical: 9, paddingHorizontal: 18 },
  visBtnPriv: { backgroundColor: C.goldDim },
  visBtnPub: { backgroundColor: C.emberDim },
  visText: { fontSize: 12, fontWeight: '500', color: C.stoneDim, fontFamily: F.sans },
  visTextPriv: { color: C.gold },
  visTextPub: { color: C.ember },

  createBtn: {
    backgroundColor: C.ember,
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  createBtnOff: { opacity: 0.4 },
  createText: { color: '#1A0908', fontWeight: '700', fontSize: 13.5, fontFamily: F.sans },
});
