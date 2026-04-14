import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { Quote } from '@/types/dashboard';

// Register standard fonts for a professional look
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica-Bold.ttf', fontWeight: 'bold' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica-Oblique.ttf', fontStyle: 'italic' },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 35, // Reduced padding to fit more on 1 page
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  accentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#00236f',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 10,
  },
  brandContainer: {
    flexDirection: 'column',
  },
  brandName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00236f',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 8,
    fontWeight: 'bold',
    color: 'rgba(0, 35, 111, 0.6)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  companyInfo: {
    textAlign: 'right',
    gap: 2,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  companyDetails: {
    fontSize: 9,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  docTitleSection: {
    borderBottomWidth: 3,
    borderBottomColor: '#00236f',
    paddingBottom: 10,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  docTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00236f',
    textTransform: 'uppercase',
  },
  docNumber: {
    color: '#e2e8f0',
  },
  clientBox: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 12,
    width: '45%',
  },
  clientRefTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#00236f',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  clientName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  clientDetails: {
    fontSize: 10,
    color: '#64748b',
    fontStyle: 'italic',
  },
  infoBox: {
    width: '45%',
    gap: 6,
  },
  infoRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  table: {
    width: '100%',
    marginTop: 15,
    flex: 1, // Will push footer down, maximizing space on page
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
    paddingVertical: 8,
    minHeight: 30,
  },
  tableHeader: {
    backgroundColor: '#00236f',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottomWidth: 0,
    borderRadius: 4,
    paddingVertical: 6,
  },
  col1: { width: '45%', paddingLeft: 10 },
  col2: { width: '10%', textAlign: 'center' },
  col3: { width: '15%', textAlign: 'center' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '15%', textAlign: 'right', paddingRight: 10 },
  
  itemDesc: { fontWeight: 'bold', fontSize: 10, marginBottom: 2 },
  itemSub: { fontSize: 8, color: '#94a3b8', fontStyle: 'italic' },
  
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  totalsBox: {
    width: 220,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#64748b',
  },
  grandTotalLine: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 2,
    borderTopColor: '#00236f',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: { fontSize: 11, fontWeight: 'bold', color: '#00236f', textTransform: 'uppercase' },
  grandTotalAmount: { fontSize: 16, fontWeight: 'bold', color: '#00236f' },

  signatureSection: {
    flexDirection: 'row',
    gap: 30,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopStyle: 'dashed',
    borderTopColor: '#e2e8f0',
    paddingTop: 15,
  },
  signatureBox: {
    flex: 1,
  },
  signatureTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#00236f',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  signaturePlaceholder: {
    height: 70,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  signatureImage: {
    maxHeight: 60,
    objectFit: 'contain',
  },
  footer: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerCol: { width: '45%' },
  footerTitle: { fontSize: 8, fontWeight: 'bold', color: '#00236f', marginBottom: 4 },
  footerText: { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
});

export function QuotePdfDocument({ quote }: { quote: Quote }) {
  const profile = quote.profiles;
  const client = quote.clients;
  const items = quote.quote_items || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.accentLine} />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandContainer}>
            <Text style={styles.brandName}>ArtisanFlow</Text>
            <Text style={styles.brandTagline}>Professional Systems</Text>
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{profile?.company_name || 'VOTRE ENTREPRISE'}</Text>
            <Text style={styles.companyDetails}>SIRET : {profile?.siret || '842 153 967'}</Text>
            <Text style={styles.companyDetails}>{profile?.address || 'LYON, FRANCE'}</Text>
            <Text style={[styles.companyDetails, { color: '#00236f', fontWeight: 'bold' }]}>{profile?.phone || ''}</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.docTitleSection}>
          <Text style={styles.docTitle}>
            Devis <Text style={styles.docNumber}>/ #{quote.number}</Text>
          </Text>
          <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>RÉFÉRENCE : PROJET-{quote.id.substring(0,4).toUpperCase()}</Text>
        </View>

        {/* Client & Dates */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 0 }}>
          <View style={styles.clientBox}>
            <Text style={styles.clientRefTitle}>Destinataire du document</Text>
            <Text style={styles.clientName}>{client?.name || 'Nom Client'}</Text>
            <Text style={styles.clientDetails}>{client?.address || ''}</Text>
            <Text style={styles.clientDetails}>{client?.postal_code} {client?.city}</Text>
          </View>
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date d'émission</Text>
              <Text style={styles.infoValue}>{new Date(quote.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date de validité</Text>
              <Text style={styles.infoValue}>
                {quote.valid_until 
                  ? new Date(quote.valid_until).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '30 JOURS'
                }
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Paiement</Text>
              <Text style={[styles.infoValue, { color: '#00236f' }]}>VIREMENT BANCAIRE</Text>
            </View>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.col1}>Désignation des prestations</Text>
            <Text style={styles.col2}>Qté</Text>
            <Text style={styles.col3}>Unité</Text>
            <Text style={styles.col4}>Unit. HT</Text>
            <Text style={styles.col5}>Total HT</Text>
          </View>
          {items.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <View style={styles.col1}>
                <Text style={styles.itemDesc}>{item.description}</Text>
                <Text style={styles.itemSub}>Prestation de service certifiée ArtisanFlow.</Text>
              </View>
              <Text style={styles.col2}>{(item.quantity || 0).toFixed(2)}</Text>
              <Text style={styles.col3}>Pce</Text>
              <Text style={styles.col4}>{(item.unit_price || 0).toLocaleString('fr-FR')} €</Text>
              <Text style={styles.col5}>{(item.total_price || 0).toLocaleString('fr-FR')} €</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalLine}>
              <Text>Total HT</Text>
              <Text>{(quote.total_ht || 0).toLocaleString('fr-FR')} €</Text>
            </View>
            <View style={styles.totalLine}>
              <Text>TVA (20%)</Text>
              <Text>{((quote.total_ttc || 0) - (quote.total_ht || 0)).toLocaleString('fr-FR')} €</Text>
            </View>
            <View style={styles.grandTotalLine}>
              <Text style={styles.grandTotalLabel}>Net à Payer</Text>
              <Text style={styles.grandTotalAmount}>{(quote.total_ttc || 0).toLocaleString('fr-FR')} €</Text>
            </View>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>Validation Artisan</Text>
            <View style={styles.signaturePlaceholder}>
              {quote.artisan_signature_url ? (
                <Image src={quote.artisan_signature_url} style={styles.signatureImage} />
              ) : (
                <Text style={{ fontSize: 8, color: '#94a3b8', fontStyle: 'italic' }}>Signature de l'Artisan</Text>
              )}
            </View>
          </View>
          <View style={styles.signatureBox}>
            <Text style={[styles.signatureTitle, { textAlign: 'right' }]}>Bon pour accord client</Text>
            <View style={styles.signaturePlaceholder}>
              {quote.client_signature_url ? (
                <Image src={quote.client_signature_url} style={styles.signatureImage} />
              ) : (
                <Text style={{ fontSize: 8, color: '#94a3b8', fontStyle: 'italic' }}>Signature du Client</Text>
              )}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerCol}>
            <Text style={styles.footerTitle}>Informations Légales</Text>
            <Text style={styles.footerText}>Assurance Décennale AXA n°1029384756</Text>
            <Text style={styles.footerText}>
              {quote.tax_rate === 0 
                ? "TVA non applicable, art. 293 B du CGI" 
                : `TVA : ${profile?.tva_intra || 'FR842153967'}`
              }
            </Text>
          </View>
          <View style={[styles.footerCol, { textAlign: 'right' }]}>
            <Text style={styles.footerTitle}>Coordonnées Bancaires</Text>
            <Text style={styles.footerText}>IBAN : FR76 3000 2005 5512 3456 7890 123</Text>
            <Text style={styles.footerText}>BIC : AGRIFRPPXXX</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
