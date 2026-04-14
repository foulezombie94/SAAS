import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font, Svg, Path, Circle } from '@react-pdf/renderer';
import { Quote } from '@/types/dashboard';

// Enregistrement précis des fontes pour correspondre à "font-black" et "italic"
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica.ttf', fontWeight: 'normal' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica-Bold.ttf', fontWeight: 'bold' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica-Oblique.ttf', fontStyle: 'italic' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica-BoldOblique.ttf', fontWeight: 'bold', fontStyle: 'italic' },
  ],
});

const PRIMARY_COLOR = '#001e5f'; // Deep blue matching the screenshot
const SLATE_900 = '#0f172a';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_300 = '#cbd5e1';
const SLATE_100 = '#f1f5f9';
const SLATE_50 = '#f8fafc';

const STATUS_MAP: Record<string, { label: string, color: string, bg: string, border: string }> = {
  draft: { label: 'BROUILLON', color: '#475569', bg: '#f1f5f9', border: '#cbd5e1' },
  sent: { label: 'EN ATTENTE', color: '#c2410c', bg: '#fff7ed', border: '#fdba74' },
  accepted: { label: 'ACCEPTÉ / SIGNÉ', color: '#047857', bg: '#ecfdf5', border: '#34d399' },
  paid: { label: 'PAYÉ', color: '#4338ca', bg: '#eef2ff', border: '#a5b4fc' },
  declined: { label: 'REFUSÉ', color: '#be123c', bg: '#fff1f2', border: '#fda4af' }
};

const styles = StyleSheet.create({
  page: {
    padding: 28, // Better breathability
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: SLATE_900,
    backgroundColor: '#ffffff',
  },
  accentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: PRIMARY_COLOR,
  },
  
  // HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 10,
    marginBottom: 35, // Breathing room
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandIconBox: {
    width: 36,
    height: 36,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTextContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 26,
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: PRIMARY_COLOR,
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 9,
    fontWeight: 'bold',
    color: SLATE_500,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 2,
    paddingLeft: 2,
  },
  companyInfo: {
    textAlign: 'right',
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  companyDetails: {
    fontSize: 10,
    color: SLATE_500,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 1.5,
    letterSpacing: 0.5,
  },
  companyPhone: {
    fontSize: 11,
    color: PRIMARY_COLOR,
    fontWeight: 'bold',
    marginTop: 2,
  },

  // TITLE & STATUS
  docTitleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 3,
    borderBottomColor: PRIMARY_COLOR,
    paddingBottom: 25, // Plently of space to push border down perfectly
    marginBottom: 25, // Breathing room for the grid
  },
  docTitleBlock: {
    flexDirection: 'column',
  },
  docTitleMain: {
    fontSize: 38, // Slightly smaller than 42 to prevent aggressive wrapping
    fontStyle: 'italic',
    marginBottom: 10, // Explicit separation between DEVIS and REFERENCE
  },
  docTitleWord: {
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
  },
  docTitleSlash: {
    fontWeight: 'bold',
    color: '#cbd5e1', // SLATE_300
  },
  docTitleNumber: {
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
  },
  docRef: {
    fontSize: 12,
    fontWeight: 'bold',
    color: SLATE_400,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  statusViewWrapper: {
    // We add paddingBottom here to ensure it doesn't touch the border
    paddingBottom: 5,
  },
  statusBadge: {
    paddingHorizontal: 16, 
    paddingVertical: 10, // Bigger pill
    borderRadius: 16,
    borderLeftWidth: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold', 
    textTransform: 'uppercase',
    letterSpacing: 1.5
  },

  // CLIENT & DATAS
  topGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25, // Generous spacing
  },
  clientBox: {
    backgroundColor: SLATE_50,
    padding: 20, // Bigger padding
    borderRadius: 16,
    width: '48%', // A little wider
    borderWidth: 1,
    borderColor: SLATE_100,
  },
  clientRefTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  clientName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  clientDetails: {
    fontSize: 11,
    color: SLATE_500,
    fontStyle: 'italic',
    marginBottom: 3,
  },
  infoLinesBox: {
    width: '45%',
    paddingLeft: 10, // Indent inside
    justifyContent: 'center',
    gap: 8, // Space between lines
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: SLATE_100,
    paddingBottom: 6,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: SLATE_400,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  infoValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: SLATE_900,
  },

  // TABLE
  table: {
    width: '100%',
    flex: 1, 
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: PRIMARY_COLOR,
    color: '#ffffff',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingVertical: 10, // Thicker header
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: SLATE_100,
    paddingVertical: 12, // Taller rows
    alignItems: 'center',
  },
  col1: { width: '45%', paddingLeft: 16 },
  col2: { width: '15%', textAlign: 'center' },
  col3: { width: '10%', textAlign: 'center' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '15%', textAlign: 'right', paddingRight: 16 },
  
  itemDesc: { 
    fontWeight: 'bold', 
    fontSize: 13,
    color: SLATE_900,
    marginBottom: 4 
  },
  itemSub: { 
    fontSize: 10,
    color: SLATE_400, 
    fontStyle: 'italic' 
  },
  itemVal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: SLATE_500,
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: SLATE_900,
  },

  // TOTALS
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    marginBottom: 20,
  },
  totalsBox: {
    width: 250,
    backgroundColor: SLATE_50,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SLATE_100,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: SLATE_400,
  },
  totalVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: SLATE_900,
  },
  grandTotalLine: {
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: PRIMARY_COLOR,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: { 
    fontSize: 12,
    fontWeight: 'bold', 
    color: PRIMARY_COLOR, 
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  grandTotalAmount: { 
    fontSize: 24,
    fontWeight: 'bold', 
    fontStyle: 'italic',
    color: PRIMARY_COLOR 
  },

  // SIGNATURES
  divider: {
    borderTopWidth: 1,
    borderTopStyle: 'dashed',
    borderTopColor: SLATE_300,
    marginVertical: 15,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  signatureBoxLeft: { width: '47%' },
  signatureBoxRight: { width: '47%', alignItems: 'flex-end' },
  sigTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  sigIconBox: {
    width: 16,
    height: 16,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sigIconBoxGrey: {
    width: 16,
    height: 16,
    backgroundColor: SLATE_100,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sigTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sigTitleGrey: {
    fontSize: 9,
    fontWeight: 'bold',
    color: SLATE_400,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  signaturePlaceholder: {
    width: '100%',
    height: 65,
    backgroundColor: SLATE_50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: SLATE_300,
  },
  signatureImage: {
    maxHeight: 55,
    maxWidth: '80%',
    objectFit: 'contain',
  },

  // FOOTER
  footer: {
    borderTopWidth: 1,
    borderTopColor: SLATE_100,
    paddingTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerCol: { width: '48%' },
  footerTitle: { 
    fontSize: 9,
    fontWeight: 'bold', 
    color: PRIMARY_COLOR, 
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footerText: { 
    fontSize: 9,
    color: SLATE_400, 
    textTransform: 'uppercase', 
    letterSpacing: 1, 
    marginBottom: 3 
  },
});

// SVG Icons
const LandmarkIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 22h18" />
    <Path d="M6 18v-7" />
    <Path d="M10 18v-7" />
    <Path d="M14 18v-7" />
    <Path d="M18 18v-7" />
    <Path d="M12 2l8 5H4z" />
  </Svg>
);

const CheckIcon = () => (
  <Svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 6 9 17l-5-5" />
  </Svg>
);

const UserIcon = () => (
  <Svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={SLATE_400} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

export function QuotePdfDocument({ quote }: { quote: Quote }) {
  const profile = quote.profiles;
  const client = quote.clients;
  const items = quote.quote_items || [];
  
  const statusInfo = STATUS_MAP[quote.status || 'draft'] || STATUS_MAP.draft;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.accentLine} />
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.brandContainer}>
            <View style={styles.brandIconBox}>
              <LandmarkIcon />
            </View>
            <View style={styles.brandTextContainer}>
              <Text style={styles.brandName}>ARTISANFLOW</Text>
              <Text style={styles.brandTagline}>Professional Systems</Text>
            </View>
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{profile?.company_name || 'VOTRE ENTREPRISE'}</Text>
            <Text style={styles.companyDetails}>SIRET : {profile?.siret || '842 153 967'}</Text>
            <Text style={styles.companyDetails}>{profile?.address || 'LYON, FRANCE'}</Text>
            <Text style={styles.companyPhone}>{profile?.phone || '+33 4 00 00 00 00'}</Text>
          </View>
        </View>

        {/* TITLE SECTION */}
        <View style={styles.docTitleSection}>
          <View style={styles.docTitleBlock}>
            <Text style={styles.docTitleMain}>
              <Text style={styles.docTitleWord}>DEVIS </Text>
              <Text style={styles.docTitleSlash}>/ </Text>
              <Text style={styles.docTitleNumber}>#{quote.number}</Text>
            </Text>
            <Text style={styles.docRef}>RÉFÉRENCE : PROJET-{quote.id.substring(0,4).toUpperCase()}</Text>
          </View>
          
          <View style={styles.statusViewWrapper}>
            <View style={[styles.statusBadge, { 
              backgroundColor: statusInfo.bg, 
              borderLeftColor: statusInfo.border 
            }]}>
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                STATUT : {statusInfo.label}
              </Text>
            </View>
          </View>
        </View>

        {/* TOP GRID (CLIENT & DATES) */}
        <View style={styles.topGrid}>
          <View style={styles.clientBox}>
            <Text style={styles.clientRefTitle}>Destinataire du document</Text>
            <Text style={styles.clientName}>{client?.name || 'Nom Client'}</Text>
            <Text style={styles.clientDetails}>{client?.address || ''}</Text>
            <Text style={styles.clientDetails}>{client?.postal_code} {client?.city}</Text>
          </View>
          <View style={styles.infoLinesBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date d'émission</Text>
              <Text style={styles.infoValue}>{new Date(quote.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date de validité</Text>
              <Text style={styles.infoValue}>
                {quote.valid_until 
                  ? new Date(quote.valid_until).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '30 Jours'
                }
              </Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={styles.infoLabel}>Paiement</Text>
              <Text style={[styles.infoValue, { color: PRIMARY_COLOR }]}>VIREMENT BANCAIRE</Text>
            </View>
          </View>
        </View>

        {/* TABLE */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.col1, styles.tableHeaderCell]}>Désignation des prestations</Text>
            <Text style={[styles.col2, styles.tableHeaderCell]}>Qté</Text>
            <Text style={[styles.col3, styles.tableHeaderCell]}>Unité</Text>
            <Text style={[styles.col4, styles.tableHeaderCell]}>Unit. HT</Text>
            <Text style={[styles.col5, styles.tableHeaderCell]}>Total HT</Text>
          </View>
          {items.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <View style={styles.col1}>
                <Text style={styles.itemDesc}>{item.description}</Text>
                <Text style={styles.itemSub}>Prestation de service certifiée ArtisanFlow.</Text>
              </View>
              <Text style={[styles.col2, styles.itemVal]}>{(item.quantity || 0).toFixed(2)}</Text>
              <Text style={[styles.col3, styles.itemSub, { fontWeight: 'bold', textTransform: 'uppercase' }]}>Pce</Text>
              <Text style={[styles.col4, styles.itemVal]}>{(item.unit_price || 0).toLocaleString('fr-FR')} €</Text>
              <Text style={[styles.col5, styles.itemTotal]}>{(item.total_price || 0).toLocaleString('fr-FR')} €</Text>
            </View>
          ))}
        </View>

        {/* TOTALS */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Total HT</Text>
              <Text style={styles.totalVal}>{(quote.total_ht || 0).toLocaleString('fr-FR')} €</Text>
            </View>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>TVA (20%)</Text>
              <Text style={styles.totalVal}>{((quote.total_ttc || 0) - (quote.total_ht || 0)).toLocaleString('fr-FR')} €</Text>
            </View>
            <View style={styles.grandTotalLine}>
              <Text style={styles.grandTotalLabel}>Net à Payer</Text>
              <Text style={styles.grandTotalAmount}>{(quote.total_ttc || 0).toLocaleString('fr-FR')} €</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* SIGNATURES */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBoxLeft}>
            <View style={styles.sigTopRow}>
              <View style={styles.sigIconBox}><CheckIcon /></View>
              <Text style={styles.sigTitle}>Validation de l'artisan</Text>
            </View>
            <View style={styles.signaturePlaceholder}>
              {quote.artisan_signature_url ? (
                <Image src={quote.artisan_signature_url} style={styles.signatureImage} />
              ) : (
                <Text style={{ fontSize: 9, color: SLATE_300, fontStyle: 'italic', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>Cliquer pour signer</Text>
              )}
            </View>
          </View>
          <View style={styles.signatureBoxRight}>
            <View style={[styles.sigTopRow, { justifyContent: 'flex-end' }]}>
              <Text style={styles.sigTitleGrey}>Bon pour accord : Signé par le client</Text>
              <View style={styles.sigIconBoxGrey}><UserIcon /></View>
            </View>
            <View style={[styles.signaturePlaceholder, { backgroundColor: 'rgba(248, 250, 252, 0.3)', borderStyle: 'solid' }]}>
              {quote.client_signature_url ? (
                <Image src={quote.client_signature_url} style={styles.signatureImage} />
              ) : (
                <Text style={{ fontSize: 9, color: SLATE_300, fontStyle: 'italic', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>Attente Signature client</Text>
              )}
            </View>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.footerCol}>
            <Text style={styles.footerTitle}>Informations Légales</Text>
            <Text style={styles.footerText}>Assurance Décennale : AXA n°1029384756.</Text>
            <Text style={styles.footerText}>
              {quote.tax_rate === 0 
                ? "TVA non applicable, art. 293 B du CGI" 
                : `N° TVA Intracommunautaire : FR 87 ${profile?.siret ? profile.siret.substring(0, 9) : '123456789'}`
              }
            </Text>
          </View>
          <View style={[styles.footerCol, { alignItems: 'flex-end' }]}>
            <Text style={styles.footerTitle}>Coordonnées Bancaires</Text>
            <Text style={styles.footerText}>IBAN : FR76 3000 2005 5512 3456 7890 123</Text>
            <Text style={styles.footerText}>BIC : AGRIFRPPXXX</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
