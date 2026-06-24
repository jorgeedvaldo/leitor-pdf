import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Text, TouchableOpacity, Alert } from 'react-native';
import Pdf from 'react-native-pdf';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../utils/theme';
import { addToRecents, isFavorite, toggleFavorite } from '../utils/storage';
import { Star, ArrowLeft, Type, FileText } from 'lucide-react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';

const PDF_VIEWER_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #525659; }
    #status { color: #eee; text-align: center; padding: 40px 20px; font-family: sans-serif; font-size: 15px; }
    #pdf-container { width: 100%; }
    .page-wrapper { position: relative; margin: 6px auto; display: block; background: #fff; }
    canvas.pdf-page { display: block; width: 100%; }
    .textLayer {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      overflow: hidden;
      opacity: 1;
      line-height: 1;
      user-select: text;
      -webkit-user-select: text;
    }
    .textLayer span {
      color: transparent;
      position: absolute;
      white-space: pre;
      cursor: text;
      transform-origin: 0% 0%;
    }
    .textLayer span::selection { background: rgba(0, 100, 255, 0.25); }
  </style>
</head>
<body>
  <div id="status">A carregar visualizador de texto...</div>
  <div id="pdf-container"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script>
    const status = document.getElementById('status');
    const container = document.getElementById('pdf-container');

    async function renderPDF(base64) {
      try {
        if (typeof pdfjsLib === 'undefined') {
          status.textContent = 'Erro: PDF.js não carregou. Verifique a ligação à internet.';
          return;
        }
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        status.textContent = 'A processar PDF...';

        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
        status.style.display = 'none';

        const devicePixelRatio = window.devicePixelRatio || 1;

        for (let num = 1; num <= pdf.numPages; num++) {
          const page = await pdf.getPage(num);
          const baseViewport = page.getViewport({ scale: 1 });
          const scale = (window.innerWidth / baseViewport.width) * devicePixelRatio;
          const viewport = page.getViewport({ scale });
          const cssWidth = window.innerWidth;
          const cssHeight = (baseViewport.height / baseViewport.width) * cssWidth;

          const wrapper = document.createElement('div');
          wrapper.className = 'page-wrapper';
          wrapper.style.width = cssWidth + 'px';
          wrapper.style.height = cssHeight + 'px';

          const canvas = document.createElement('canvas');
          canvas.className = 'pdf-page';
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const textDiv = document.createElement('div');
          textDiv.className = 'textLayer';

          wrapper.appendChild(canvas);
          wrapper.appendChild(textDiv);
          container.appendChild(wrapper);

          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

          const textContent = await page.getTextContent();
          const renderTask = pdfjsLib.renderTextLayer({
            textContentSource: textContent,
            container: textDiv,
            viewport: viewport,
            textDivs: [],
          });
          await renderTask.promise;

          // Scale text spans from canvas coords to CSS coords
          const scaleX = cssWidth / viewport.width;
          const scaleY = cssHeight / viewport.height;
          Array.from(textDiv.querySelectorAll('span')).forEach(span => {
            const transform = span.style.transform;
            if (transform) {
              span.style.transform = transform.replace(
                /matrix\(([^)]+)\)/,
                (_, m) => {
                  const parts = m.split(',').map(Number);
                  parts[4] = parts[4] * scaleX;
                  parts[5] = parts[5] * scaleY;
                  return 'matrix(' + parts.join(',') + ')';
                }
              );
            }
            const left = parseFloat(span.style.left);
            const top = parseFloat(span.style.top);
            if (!isNaN(left)) span.style.left = (left * scaleX) + 'px';
            if (!isNaN(top)) span.style.top = (top * scaleY) + 'px';
            span.style.fontSize = (parseFloat(span.style.fontSize) * scaleY) + 'px';
          });
        }
      } catch (e) {
        status.style.color = '#ff6b6b';
        status.style.display = 'block';
        status.textContent = 'Erro ao carregar PDF: ' + e.message;
      }
    }

    // Receive base64 data from React Native
    document.addEventListener('message', e => renderPDF(e.data));
    window.addEventListener('message', e => renderPDF(e.data));
  </script>
</body>
</html>`;

export default function PdfViewerScreen({ route, navigation }) {
    const { uri, name, fromIntent } = route.params;
    const [loading, setLoading] = useState(true);
    const [favorite, setFavorite] = useState(false);
    const [error, setError] = useState(null);
    const [textMode, setTextMode] = useState(false);
    const [preparingText, setPreparingText] = useState(false);
    const [pdfBase64, setPdfBase64] = useState(null);
    const webViewRef = useRef(null);

    useEffect(() => {
        const init = async () => {
            const fileObj = {
                uri: uri,
                name: name || uri.split('/').pop(),
                lastOpened: new Date().toISOString()
            };
            await addToRecents(fileObj);
            const fav = await isFavorite(uri);
            setFavorite(fav);
            setLoading(false);
        };
        init();
    }, [uri]);

    const handleFavorite = async () => {
        const fileObj = { uri, name: name || uri.split('/').pop() };
        const newStatus = await toggleFavorite(fileObj);
        setFavorite(newStatus);
    };

    const loadPdfBase64 = async () => {
        if (pdfBase64) return pdfBase64;
        setPreparingText(true);
        try {
            let filePath = uri;
            if (uri.startsWith('file://')) {
                filePath = uri.replace('file://', '');
                const b64 = await ReactNativeBlobUtil.fs.readFile(filePath, 'base64');
                setPdfBase64(b64);
                return b64;
            } else {
                // content:// URI — copy to cache first
                const dest = ReactNativeBlobUtil.fs.dirs.CacheDir + '/pdf_text_temp.pdf';
                await ReactNativeBlobUtil.config({ fileCache: false })
                    .fetch('GET', uri)
                    .then(res => res.flush());
                await ReactNativeBlobUtil.fs.cp(uri, dest).catch(() => {});
                const b64 = await ReactNativeBlobUtil.fs.readFile(dest, 'base64');
                setPdfBase64(b64);
                return b64;
            }
        } catch (e) {
            Alert.alert('Erro', 'Não foi possível carregar o texto do PDF.\n' + (e.message || ''));
            return null;
        } finally {
            setPreparingText(false);
        }
    };

    const toggleTextMode = async () => {
        if (!textMode) {
            const b64 = await loadPdfBase64();
            if (b64) setTextMode(true);
        } else {
            setTextMode(false);
        }
    };

    const onWebViewLoad = () => {
        if (pdfBase64 && webViewRef.current) {
            webViewRef.current.postMessage(pdfBase64);
        }
    };

    const source = { uri: uri, cache: true };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                    <ArrowLeft color={theme.colors.white} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{name || 'Document'}</Text>
                <TouchableOpacity onPress={toggleTextMode} style={styles.iconButton} disabled={preparingText}>
                    {preparingText ? (
                        <ActivityIndicator size="small" color={theme.colors.white} />
                    ) : textMode ? (
                        <FileText color="#FFD700" size={22} />
                    ) : (
                        <Type color={theme.colors.white} size={22} />
                    )}
                </TouchableOpacity>
                <TouchableOpacity onPress={handleFavorite} style={styles.iconButton}>
                    <Star
                        color={favorite ? '#FFD700' : theme.colors.white}
                        fill={favorite ? '#FFD700' : 'transparent'}
                        size={24}
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.pdfContainer}>
                {textMode ? (
                    <WebView
                        ref={webViewRef}
                        source={{ html: PDF_VIEWER_HTML }}
                        style={styles.webview}
                        javaScriptEnabled
                        domStorageEnabled
                        mixedContentMode="always"
                        allowFileAccess
                        onLoadEnd={onWebViewLoad}
                        onError={() => Alert.alert('Erro', 'Falha ao carregar o visualizador de texto.')}
                    />
                ) : error ? (
                    <View style={styles.center}>
                        <Text style={styles.errorText}>Erro ao abrir o arquivo: {error}</Text>
                    </View>
                ) : (
                    <Pdf
                        source={source}
                        onLoadComplete={(numberOfPages) => {
                            console.log(`Number of pages: ${numberOfPages}`);
                        }}
                        onPageChanged={(page, numberOfPages) => {
                            console.log(`Current page: ${page}`);
                        }}
                        onError={(err) => {
                            console.error(err);
                            setError(err?.message || 'Erro desconhecido');
                        }}
                        onPressLink={(uri) => {
                            console.log(`Link pressed: ${uri}`);
                        }}
                        style={styles.pdf}
                        trustAllCerts={false}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        height: 60,
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.m,
    },
    headerTitle: {
        flex: 1,
        color: theme.colors.white,
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: theme.spacing.m,
    },
    iconButton: {
        padding: theme.spacing.s,
        marginLeft: 4,
    },
    pdfContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pdf: {
        flex: 1,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    webview: {
        flex: 1,
        width: Dimensions.get('window').width,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    errorText: {
        color: theme.colors.error,
        fontSize: 16,
        textAlign: 'center'
    }
});
