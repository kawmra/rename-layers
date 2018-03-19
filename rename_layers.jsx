
/*
 * layer: {
 *   name: String
 *   children: Array<Layer>
 * }
 * 
 * aiLayer: Illustrator の Layer オブジェクト
 * https://wwwimages2.adobe.com/content/dam/acom/en/devnet/illustrator/pdf/Illustrator_JavaScript_Scripting_Reference_2017.pdf
 */

var metaTextFrameName = "Rename Layers Meta Text"

var selectedItem = activeDocument.selection[0];
if (selectedItem && selectedItem.name === metaTextFrameName) {
    if (confirm("選択中の内容でレイヤー名を置換します。よろしいですか？")) {
        var str = selectedItem.contents.replace(/\n/g, '');
        var layer = parse(str.split("\r")); // 改行コードは強制的に \r になるっぽい
        var result = renameLayer(activeDocument.activeLayer, layer);
        if (result) {
            alert("レイヤー名の置換に成功しました。");
        } else {
            alert("レイヤー名の置換に失敗しました。");
        }
    }
} else {
    if (confirm("現在のレイヤーの名前を取得します。")) {
        var str = getActiveLayerNameStr();
        createTextFrame(str);
    }
}

// アクティブなレイヤのレイヤ名文字列を取得
function getActiveLayerNameStr() {
    var aiLayer = activeDocument.activeLayer;
    var layers = transformToLayerRecursive(aiLayer);
    return stringifyRecursive(layers).join("\n");
}

// テキストフレームを追加
function createTextFrame(str) {
    var aiLayer = activeDocument.activeLayer;
    var centerPoint = activeDocument.activeView.centerPoint;
    var textFrame = aiLayer.textFrames.add();
    textFrame.contents = str;
    textFrame.position = centerPoint;
    textFrame.selected = true;
    textFrame.name = metaTextFrameName;
}

// [layer] に指定したレイヤの構造を持った Layer オブジェクトを返します。
function transformToLayerRecursive(aiLayer) {
    var aiLayers = aiLayer.layers;
    if (aiLayers === undefined || aiLayers.length === 0) {
        return {
            name: aiLayer.name,
            children: []
        };
    }
    var sublayers = [];
    for (var i = 0, len = aiLayers.length; i < len; i++) {
        var _aiLayer = aiLayers[i];
        sublayers.push(transformToLayerRecursive(_aiLayer));
    }
    return {
        name: aiLayer.name,
        children: sublayers
    };
}

function validateLayer(aiLayer, layer) {
    var aiLayers = aiLayer.layers;
    var children = layer.children;
    if (aiLayers.length !== children.length) {
        alert("レイヤー '" + aiLayer.name + "' のサブレイヤーの数が異なります\n\n変更前: " + aiLayers.length + "\n変更後: " + children.length);
        return false;
    }
    for (var i = 0, len = aiLayers.length; i < len; i++) {
        if (!validateLayer(aiLayers[i], children[i])) {
            return false;
        }
    }
    return true;
}

function renameLayer(aiLayer, layer) {
    if (!validateLayer(aiLayer, layer)) {
        return false;
    }
    aiLayer.name = layer.name;
    var aiLayers = aiLayer.layers;
    var layers = layer.children;
    for (var i = 0, len = aiLayers.length; i < len; i++) {
        var subAiLayer = aiLayers[i];
        var subLayer = layers[i];
        var result = renameLayer(subAiLayer, subLayer);
        if (result === false) {
            return false;
        }
    }
    return true;
}

function stringifyRecursive(layer, level) {
    if (level === undefined) {
        level = 1;
    }
    var a = [];
    var bullets = levelString(level);
    a.push(bullets + " " + layer.name);
    var children = layer.children;
    if (children.length > 0) {
        var nextLevel = level + 1;
        for (var i = 0, len_i = children.length; i < len_i; i++) {
            var childrenStrings = stringifyRecursive(layer.children[i], nextLevel);
            for (var c = 0, len_c = childrenStrings.length; c < len_c; c++) {
                a.push(childrenStrings[c]);
            }
        }
    }
    return a;
}

function parse(layerStrArray) {
    var stacks = [createLayer("root", [])];
    for (var i = 0, len = layerStrArray.length; i < len; i++) {
        var p = parseLine(layerStrArray[i]);
        var layer = createLayer(p.name, []);
        stacks[p.level] = layer;
        if (stacks[p.level - 1] !== undefined) {
            stacks[p.level - 1].children.push(layer);
        }
    }
    return stacks[0].children[0]; // TOP レベルは必ずひとつ
}

function parseLine(line) {
    var match = line.match(/^(-+) (.*)$/);
    if (!match) {
        alert(line);
        return null;
    }
    var bullet = match[1];
    var name = match[2];
    return {
        level: bullet.length,
        name: name
    };
}

function createLayer(name, children) {
    if (children === undefined) {
        children = []
    }
    return {
        name: name,
        children: children
    };
}

function levelString(level) {
    var str = "";
    for (var i = 0; i < level; i++) {
        str += "-";
    }
    return str;
}