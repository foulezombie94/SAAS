import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font, Svg, Path, Circle } from '@react-pdf/renderer';
import { Quote } from '@/types/dashboard';

// Enregistrement précis des fontes pour correspondre à "font-black" et "italic"
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://raw.githubusercontent.com/foulezombie94/SAAS/main/public/fonts/inter-ttf/Inter-Regular.ttf', fontWeight: 'normal' },
    { src: 'https://raw.githubusercontent.com/foulezombie94/SAAS/main/public/fonts/inter-ttf/Inter-Bold.ttf', fontWeight: 'bold' },
    { src: 'https://raw.githubusercontent.com/foulezombie94/SAAS/main/public/fonts/inter-ttf/Inter-Italic.ttf', fontStyle: 'italic' },
    { src: 'https://raw.githubusercontent.com/foulezombie94/SAAS/main/public/fonts/inter-ttf/Inter-BlackItalic.ttf', fontWeight: 'bold', fontStyle: 'italic' },
  ],
});

const PRIMARY_COLOR = '#001e5f';
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
    padding: 24,
    fontFamily: 'Inter',
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
    marginTop: 8,
    marginBottom: 20,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandIconBox: {
    width: 38,
    height: 38,
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
    fontSize: 8,
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
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  companyDetails: {
    fontSize: 9,
    color: SLATE_500,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 1.5,
    letterSpacing: 0.5,
  },
  companyPhone: {
    fontSize: 10,
    color: PRIMARY_COLOR,
    fontWeight: 'bold',
    marginTop: 2,
  },

  // TITLE & STATUS
  docTitleSection: {
    width: '100%',
    flexDirection: 'column',
    borderBottomWidth: 3,
    borderBottomColor: PRIMARY_COLOR,
    paddingBottom: 15,
    marginBottom: 20,
  },
  docTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8, // Space between Devis number and Reference
  },
  docTitleCol: {
    flexDirection: 'column',
  },
  docTitleMain: {
    fontSize: 36, 
    fontStyle: 'italic',
    lineHeight: 1,
    letterSpacing: -1, 
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
    fontSize: 10,
    fontWeight: 'bold',
    color: SLATE_400,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  statusBadge: {
    paddingHorizontal: 16, 
    paddingVertical: 10,
    borderRadius: 14,
    borderLeftWidth: 3,
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
    marginBottom: 20,
  },
  clientBox: {
    backgroundColor: SLATE_50,
    padding: 18, 
    borderRadius: 16, 
    width: '48%', 
    borderWidth: 1,
    borderColor: SLATE_100,
  },
  clientRefTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  clientName: {
    fontSize: 20, // Huge name 
    fontWeight: 'bold',
    marginBottom: 6,
  },
  clientDetails: {
    fontSize: 10,
    color: SLATE_500,
    fontStyle: 'italic',
    marginBottom: 3,
  },
  infoLinesBox: {
    width: '45%',
    paddingLeft: 10,
    justifyContent: 'center',
    gap: 8, 
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: SLATE_100,
    paddingBottom: 5,
  },
  infoLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: SLATE_400,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  infoValue: {
    fontSize: 11, // Emphasized
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
    paddingVertical: 10,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: SLATE_100,
    paddingVertical: 8,
    alignItems: 'center',
  },
  col1: { width: '45%', paddingLeft: 16 },
  col2: { width: '15%', textAlign: 'center' },
  col3: { width: '10%', textAlign: 'center' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '15%', textAlign: 'right', paddingRight: 16 },
  
  itemDesc: { 
    fontWeight: 'bold', 
    fontSize: 12,
    color: SLATE_900,
    marginBottom: 3 
  },
  itemSub: { 
    fontSize: 8, 
    color: SLATE_400, 
    fontStyle: 'italic' 
  },
  itemVal: {
    fontSize: 10,
    fontWeight: 'bold',
    color: SLATE_500,
  },
  itemTotal: {
    fontSize: 12,
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: SLATE_900,
  },

  // TOTALS
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
    marginBottom: 15,
  },
  totalsBox: {
    width: 280, 
    backgroundColor: SLATE_50,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SLATE_100,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: SLATE_400,
  },
  totalVal: {
    fontSize: 10,
    fontWeight: 'bold',
    color: SLATE_900,
  },
  grandTotalLine: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: PRIMARY_COLOR,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: { 
    fontSize: 10,
    fontWeight: 'bold', 
    color: PRIMARY_COLOR, 
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  grandTotalAmount: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    fontStyle: 'italic',
    color: PRIMARY_COLOR 
  },

  // SIGNATURES
  divider: {
    borderTopWidth: 1,
    borderTopStyle: 'dashed',
    borderTopColor: SLATE_300,
    marginVertical: 12,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
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
    width: 14,
    height: 14,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sigIconBoxGrey: {
    width: 14,
    height: 14,
    backgroundColor: SLATE_100,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sigTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sigTitleGrey: {
    fontSize: 8,
    fontWeight: 'bold',
    color: SLATE_400,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  signaturePlaceholder: {
    width: '100%',
    height: 52, 
    backgroundColor: SLATE_50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: SLATE_300,
  },
  signatureImage: {
    maxHeight: 45,
    maxWidth: '80%',
    objectFit: 'contain',
  },

  // FOOTER
  footer: {
    borderTopWidth: 1,
    borderTopColor: SLATE_100,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerCol: { width: '48%' },
  footerTitle: { 
    fontSize: 8,
    fontWeight: 'bold', 
    color: PRIMARY_COLOR, 
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footerText: { 
    fontSize: 8,
    color: SLATE_400, 
    textTransform: 'uppercase', 
    letterSpacing: 1, 
    marginBottom: 2 
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
  <Svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 6 9 17l-5-5" />
  </Svg>
);

const UserIcon = () => (
  <Svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={SLATE_400} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

        {/* EXACT ALIGNED TITLE SECTION (IMAGE 1 PARITY) */}
        <View style={styles.docTitleSection}>
          <View style={styles.docTitleRow}>
            <View style={styles.docTitleCol}>
              <Text style={styles.docTitleMain}>
                <Text style={styles.docTitleWord}>DEVIS </Text>
                <Text style={styles.docTitleSlash}>/</Text>
              </Text>
              <Text style={styles.docTitleMain}>
                <Text style={styles.docTitleNumber}>#{quote.number}</Text>
              </Text>
            </View>
            
            <View style={[styles.statusBadge, { 
              backgroundColor: statusInfo.bg, 
              borderLeftColor: statusInfo.border 
            }]}>
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                STATUT : {statusInfo.label}
              </Text>
            </View>
          </View>
          
          <Text style={styles.docRef}>RÉFÉRENCE : PROJET-{quote.id.substring(0,4).toUpperCase()}</Text>
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
              <Text style={[styles.col3, styles.itemSub, { fontWeight: 'bold', textTransform: 'uppercase' }]}>PCE</Text>
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
              <Text style={styles.sigTitle}>Validation de l'Artisan</Text>
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
                <Text style={{ fontSize: 9, color: SLATE_300, fontStyle: 'italic', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>Attente Signature Client</Text>
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
                : `N° TVA Intracommunautaire : ${profile?.tva_intra || 'FR842153967'}`
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
