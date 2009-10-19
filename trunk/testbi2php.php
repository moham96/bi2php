<?php 
header('Content-Type: text/javascript');
require('biRSA.php');
$keyEncrypt = new biRSAKeyPair(
 "142ab99af88b540da02041f562804665",
 "0",
 "30f1b353d5a09313825ca5ef7c87033f"
);
$keyDecrypt = new biRSAKeyPair(
 "0",
 "266f58f4654cc23e392c2eb99ec90635",
 "30f1b353d5a09313825ca5ef7c87033f"
);

if ($_POST['step'] == 2){
	$decrypted = str_replace( array("\\", '"', '<', "\n", "\r"), array('\\\\', '\\"', "\<", "\\n", "\\r"), $keyDecrypt->biDecryptedString($_POST['encrypted'], FALSE));
	echo <<<EOT
document.getElementById("serverDecryptedText").value = "$decrypted";
EOT;
}

if ($_POST['step'] == 3){
	$encrypted = str_replace( array('"', '<', "\n", "\r"), array('\\"', "\<", "\\n", "\\r" ), $keyEncrypt->biEncryptedString($_POST['decrypted'], FALSE));
	echo <<<EOT
document.getElementById("serverEncryptedText").value = "$encrypted";
EOT;
}