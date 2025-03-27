import React, { useState } from 'react';
import Popover from 'components/Popover/Popover.react';
import Position from 'lib/Position';
import styles from 'dashboard/Data/AppOverview/AppOverview.scss';
import Icon from 'components/Icon/Icon.react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
// eslint-disable-next-line no-unused-vars
import customPrisma from 'stylesheets/b4a-prisma.css';
// import B4aTooltip from 'components/Tooltip/B4aTooltip.react';

const LanguageDocMap = {
  rest: {
    content: `Since no SDK installation is required, you can simply use HTTP requests with the proper headers.

### Authentication Headers
~~~bash
X-Parse-Application-Id: YOUR_APP_ID  
X-Parse-REST-API-Key: YOUR_REST_API_KEY  
Content-Type: application/json  
~~~

### Create Object
~~~bash
curl -X POST \
  -H "X-Parse-Application-Id: YOUR_APP_ID" \
  -H "X-Parse-REST-API-Key: YOUR_REST_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"score":1337,"playerName":"Sean Plott","cheatMode":false}' \
  https://parseapi.back4app.com/classes/GameScore
~~~

### Read (Query) Objects
~~~bash
curl -X GET \
  -H "X-Parse-Application-Id: YOUR_APP_ID" \
  -H "X-Parse-REST-API-Key: YOUR_REST_API_KEY" \
  https://parseapi.back4app.com/classes/GameScore
~~~

### Update Object
~~~bash
curl -X PUT \
  -H "X-Parse-Application-Id: YOUR_APP_ID" \
  -H "X-Parse-REST-API-Key: YOUR_REST_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"score":1338}' \
  https://parseapi.back4app.com/classes/GameScore/OBJECT_ID
~~~

### Delete Object
~~~bash
curl -X DELETE \
  -H "X-Parse-Application-Id: YOUR_APP_ID" \
  -H "X-Parse-REST-API-Key: YOUR_REST_API_KEY" \
  https://parseapi.back4app.com/classes/GameScore/OBJECT_ID
~~~
`,
    icon: 'b4a-api-icon',
    name: 'REST API',
    iconColor: '#cccccc',
  },
  graphql: {
    content: `Make sure GraphQL is enabled on your Parse Server.

### Endpoint & Headers
- **Endpoint:**  
  \`\`\`bash
  https://parseapi.back4app.com/graphql
  \`\`\`
- **Headers:**  
  \`\`\`bash
  X-Parse-Application-Id: YOUR_APP_ID  
  X-Parse-REST-API-Key: YOUR_REST_API_KEY
  Content-Type: application/json
  \`\`\`

### Create Object (Mutation)
\`\`\`graphql

# Create a class first
mutation CreateClass {
  createClass(input:{
    name: "GameScore"
    schemaFields: {
      addNumbers: [{name: "score"}]
      addStrings: [{name: "playerName"}]
      addBooleans: [{name:  "cheatMode"}]
    }
  }){
    class{
      schemaFields{
        name
        __typename
      }
    }
  }
}

# Create an object
mutation CreateGameScore {
  createGameScore(
    input: {
      fields: {
        playerName: "John Doe",
        score: 1200,
        cheatMode: false
      }
    }
  ) {
    gameScore {
      objectId
      createdAt
    }
  }
}
\`\`\`

### Read (Query) Objects
\`\`\`graphql
query {
  gameScores {
    edges {
      node {
        id
        objectId
        playerName
        score
        createdAt
      }
    }
  }
}
\`\`\`

### Update Object (Mutation)
\`\`\`graphql
mutation UpdateGameScore {
  updateGameScore(
    input: {
      id: "OBJECT_ID",
      fields: {
        score: 1338
      }
    }
  ) {
    gameScore {
      objectId
      updatedAt
    }
  }
}
\`\`\`

### Delete Object (Mutation)
\`\`\`graphql
mutation DeleteObject {
  deleteHero(input: {
    id: "SGVybzpVRm5TVDM1YnBp"
  }) {
    hero {
      id
    }
  }
}
\`\`\`
`,
    icon: 'graphql',
    name: 'GraphQL API',
    iconColor: '#f6009c',
  },

  react: {
    content: `### Installation
~~~bash
npm install parse --save
~~~

### Initialization
~~~javascript
import Parse from 'parse';

function initializeParse() {
  Parse.initialize("YOUR_APP_ID", "YOUR_JS_KEY");
  Parse.serverURL = 'https://parseapi.back4app.com';
}

// Call initializeParse() in your useEffect (or in _app.js for Next.js)
useEffect(() => {
  initializeParse();
}, []);
~~~

### CRUD Operations

#### Create
~~~javascript
const gameScore = new Parse.Object("GameScore");
gameScore.set("score", 1337);
gameScore.set("playerName", "Sean Plott");
gameScore.set("cheatMode", false);
await gameScore.save();
~~~

#### Read
~~~javascript
const query = new Parse.Query("GameScore");
query.greaterThan("score", 1000);
const results = await query.find();
console.log("Retrieved", results.length, "objects");
~~~

#### Update
~~~javascript
const objectId = "OBJECT_ID";
const queryUpdate = new Parse.Query("GameScore");
const gameScoreToUpdate = await queryUpdate.get(objectId);
gameScoreToUpdate.set("score", 1338);
await gameScoreToUpdate.save();
~~~

#### Delete
~~~javascript
const queryDelete = new Parse.Query("GameScore");
const gameScoreToDelete = await queryDelete.get("OBJECT_ID");
await gameScoreToDelete.destroy();
~~~
`,
    icon: 'react-icon',
    name: 'React.js / Next.js',
    iconColor: '#58c4dc',
  },

  'js-node': {
    content: `### Installation
~~~bash
npm install parse --save
~~~

### Initialization
~~~javascript
const Parse = require('parse/node');
Parse.initialize("YOUR_APP_ID", "YOUR_JS_KEY");
Parse.serverURL = 'https://parseapi.back4app.com';
~~~

### CRUD Operations

#### Create
~~~javascript
const gameScore = new Parse.Object("GameScore");
gameScore.set("score", 1337);
gameScore.set("playerName", "Sean Plott");
gameScore.set("cheatMode", false);
gameScore.save().then(result => {
  console.log('Created object:', result.id);
}).catch(error => console.error('Error:', error.message));
~~~

#### Read
~~~javascript
const query = new Parse.Query("GameScore");
query.greaterThan("score", 1000);
query.find().then(results => {
  results.forEach(obj => console.log(obj.id, obj.get("playerName")));
}).catch(error => console.error('Error:', error.message));
~~~

#### Update
~~~javascript
const queryUpdate = new Parse.Query("GameScore");
queryUpdate.get("OBJECT_ID").then(gameScore => {
  gameScore.set("score", 1338);
  return gameScore.save();
}).then(() => console.log('Updated object'))
.catch(error => console.error('Error:', error.message));
~~~

#### Delete
~~~javascript
const queryDelete = new Parse.Query("GameScore");
queryDelete.get("OBJECT_ID").then(gameScore => {
  return gameScore.destroy();
}).then(() => console.log('Deleted object'))
.catch(error => console.error('Error:', error.message));
~~~
`,
    icon: 'node-js',
    name: 'JavaScript (Node.js)',
    iconColor: '#21a366',
  },

  'js-browser': {
    content: `### Installation
Include the Parse SDK via CDN:
~~~html
<script type="text/javascript" src="https://unpkg.com/parse/dist/parse.min.js"></script>
~~~

### Initialization
~~~javascript
Parse.initialize("YOUR_APP_ID", "YOUR_JS_KEY");
Parse.serverURL = 'https://parseapi.back4app.com';
~~~

### CRUD Operations

#### Create
~~~javascript
const gameScore = new Parse.Object("GameScore");
gameScore.set("score", 1337);
gameScore.set("playerName", "Sean Plott");
gameScore.set("cheatMode", false);
gameScore.save().then((result) => {
  console.log('Created object:', result.id);
}).catch(error => console.error('Error:', error.message));
~~~

#### Read
~~~javascript
const query = new Parse.Query("GameScore");
query.greaterThan("score", 1000);
query.find().then((results) => {
  results.forEach(obj => console.log(obj.id, obj.get("playerName")));
}).catch(error => console.error('Error:', error.message));
~~~

#### Update
~~~javascript
const queryUpdate = new Parse.Query("GameScore");
queryUpdate.get("OBJECT_ID").then((gameScore) => {
  gameScore.set("score", 1338);
  return gameScore.save();
}).then(() => {
  console.log('Updated object');
}).catch(error => console.error('Error:', error.message));
~~~

#### Delete
~~~javascript
const queryDelete = new Parse.Query("GameScore");
queryDelete.get("OBJECT_ID").then((gameScore) => {
  return gameScore.destroy();
}).then(() => {
  console.log('Deleted object');
}).catch(error => console.error('Error:', error.message));
~~~
`,
    icon: 'js-icon',
    name: 'JavaScript (Browser)',
    iconColor: '#f7df1c',
  },
  flutter: {
    content: `### Installation
Add to your \`pubspec.yaml\`:
~~~yaml
dependencies:
  parse_server_sdk_flutter: ^latest_version
~~~

### Initialization
~~~dart
import 'package:parse_server_sdk_flutter/parse_server_sdk_flutter.dart';

void main() async {
  await Parse().initialize(
    'YOUR_APP_ID',
    'https://parseapi.back4app.com',
    clientKey: 'YOUR_CLIENT_KEY',
    debug: true,
  );
}
~~~

### CRUD Operations

#### Create
~~~dart
Future<void> createObject() async {
  final gameScore = ParseObject('GameScore')
    ..set('score', 1337)
    ..set('playerName', 'Sean Plott')
    ..set('cheatMode', false);
    
  final response = await gameScore.save();
  if (response.success) {
    print('Created object: \${response.result.objectId}');
  }
}
~~~

#### Read
~~~dart
Future<void> queryObjects() async {
  final query = QueryBuilder<ParseObject>(ParseObject('GameScore'))
    ..whereGreaterThan('score', 1000);
    
  final response = await query.query();
  if (response.success && response.results != null) {
    for (var gameScore in response.results!) {
      print('\${gameScore.objectId} - \${gameScore.get < String > 'playerName'}');
    }
  }
}
~~~

#### Update
~~~dart
Future<void> updateObject(String objectId) async {
  final query = QueryBuilder<ParseObject>(ParseObject('GameScore'))
    ..whereEqualTo('objectId', objectId);
    
  final response = await query.query();
  if (response.success && response.results?.isNotEmpty == true) {
    final gameScore = response.results!.first;
    gameScore.set('score', 1338);
    await gameScore.save();
    print('Updated object successfully');
  }
}
~~~

#### Delete
~~~dart
Future<void> deleteObject(String objectId) async {
  final gameScore = ParseObject('GameScore')..objectId = objectId;
  final response = await gameScore.delete();
  if (response.success) {
    print('Deleted object successfully');
  }
}
~~~
`,
    icon: 'flutter',
    name: 'Flutter',
    iconColor: '#4fe6ff',
  },

  'js-react-native': {
    content: `### Installation
~~~bash
npm install parse @react-native-async-storage/async-storage --save
~~~
For iOS, run:
~~~bash
cd ios && pod install
~~~

### Initialization
~~~javascript
import Parse from 'parse/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

Parse.setAsyncStorage(AsyncStorage);
Parse.initialize("YOUR_APP_ID", "YOUR_JS_KEY");
Parse.serverURL = 'https://parseapi.back4app.com';
~~~

### CRUD Operations

#### Create
~~~javascript
async function createObject() {
  const gameScore = new Parse.Object("GameScore");
  gameScore.set("score", 1337);
  gameScore.set("playerName", "Sean Plott");
  gameScore.set("cheatMode", false);
  
  try {
    const result = await gameScore.save();
    console.log('Created object:', result.id);
  } catch (error) {
    console.error('Error:', error);
  }
}
~~~

#### Read
~~~javascript
async function queryObjects() {
  const GameScore = Parse.Object.extend("GameScore");
  const query = new Parse.Query(GameScore);
  query.greaterThan("score", 1000);
  
  try {
    const results = await query.find();
    results.forEach(obj => console.log(obj.id, obj.get("playerName")));
  } catch (error) {
    console.error('Error:', error);
  }
}
~~~

#### Update
~~~javascript
async function updateObject(objectId) {
  const GameScore = Parse.Object.extend("GameScore");
  const query = new Parse.Query(GameScore);
  
  try {
    const gameScore = await query.get(objectId);
    gameScore.set("score", 1338);
    await gameScore.save();
    console.log('Updated object');
  } catch (error) {
    console.error('Error:', error);
  }
}
~~~

#### Delete
~~~javascript
async function deleteObject(objectId) {
  const GameScore = Parse.Object.extend("GameScore");
  const query = new Parse.Query(GameScore);
  
  try {
    const gameScore = await query.get(objectId);
    await gameScore.destroy();
    console.log('Deleted object');
  } catch (error) {
    console.error('Error:', error);
  }
}
~~~
`,
    icon: 'react-icon',
    name: 'React Native',
    iconColor: '#58c4dc',
  },

  ios: {
    content: `### Installation
Install via Swift Package Manager (SPM) in Xcode:
~~~
File > Add Packages... > https://github.com/parse-community/Parse-Swift
~~~

### Initialization
~~~swift
import ParseSwift

@main
struct MyApp: App {
    init() {
        ParseSwift.initialize(
            applicationId: "YOUR_APP_ID",
            clientKey: "YOUR_CLIENT_KEY",
            serverURL: URL(string: "https://parseapi.back4app.com")!
        )
    }
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
~~~

### CRUD Operations

#### Create
~~~swift
func createObject() {
    var gameScore = ParseObject(className: "GameScore")
    gameScore["score"] = 1337
    gameScore["playerName"] = "Sean Plott"
    gameScore["cheatMode"] = false

    gameScore.save { result in
        switch result {
        case .success(let savedScore):
            print("Created object: \(savedScore.objectId ?? "unknown")")
        case .failure(let error):
            print("Error:", error)
        }
    }
}
~~~

#### Read
~~~swift
func queryObjects() {
    let query = ParseQuery(className: "GameScore").where("score" > 1000)

    query.find { result in
        switch result {
        case .success(let scores):
            scores.forEach { score in
                print("\(score.objectId ?? "unknown") - \(score["playerName"] ?? "unknown")")
            }
        case .failure(let error):
            print("Error:", error)
        }
    }
}
~~~

#### Update
~~~swift
func updateObject(objectId: String) {
    let query = ParseQuery(className: "GameScore").where("objectId" == objectId)

    query.first { result in
        switch result {
        case .success(var gameScore):  // ✅ \`var\` só aqui, pois é necessário para modificar
            gameScore["score"] = 1338
            gameScore.save { saveResult in
                switch saveResult {
                case .success:
                    print("Updated object successfully")
                case .failure(let error):
                    print("Error:", error)
                }
            }
        case .failure(let error):
            print("Error:", error)
        }
    }
}
~~~

#### Delete
~~~swift
func deleteObject(objectId: String) {
    let query = ParseQuery(className: "GameScore").where("objectId" == objectId)

    query.first { result in
        switch result {
        case .success(let gameScore):
            gameScore.delete { deleteResult in
                switch deleteResult {
                case .success:
                    print("Deleted object successfully")
                case .failure(let error):
                    print("Error:", error)
                }
            }
        case .failure(let error):
            print("Error:", error)
        }
    }
}
~~~
`,
    icon: 'apple',
    name: 'iOS Swift',
    iconColor: '#a0a0a0',
  },
  android: {
    content: `### Installation

Add the following in your \`build.gradle\`:
~~~groovy
repositories {
    mavenCentral()
    jcenter()
    maven { url 'https://jitpack.io' }
}

dependencies {
    implementation 'com.github.parse-community.Parse-SDK-Android:parse:latest_version'
}
~~~

### Initialization
~~~java
import com.parse.Parse;

public class MyApp extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        Parse.initialize(new Parse.Configuration.Builder(this)
            .applicationId("YOUR_APP_ID")
            .clientKey("YOUR_CLIENT_KEY")
            .server("https://parseapi.back4app.com")
            .build()
        );
    }
}
~~~

### CRUD Operations

#### Create
~~~java
public void createObject() {
    ParseObject gameScore = new ParseObject("GameScore");
    gameScore.put("score", 1337);
    gameScore.put("playerName", "Sean Plott");
    gameScore.put("cheatMode", false);
    gameScore.saveInBackground(e -> {
        if (e == null) {
            Log.d("CREATE", "Created object: " + gameScore.getObjectId());
        } else {
            Log.e("CREATE", "Error: " + e.getMessage());
        }
    });
}
~~~

#### Read
~~~java
public void queryObjects() {
    ParseQuery<ParseObject> query = ParseQuery.getQuery("GameScore");
    query.whereGreaterThan("score", 1000);
    query.findInBackground((objects, e) -> {
        if (e == null) {
            for (ParseObject object : objects) {
                Log.d("QUERY", object.getObjectId() + " - " + object.getString("playerName"));
            }
        } else {
            Log.e("QUERY", "Error: " + e.getMessage());
        }
    });
}
~~~

#### Update
~~~java
public void updateObject(String objectId) {
    ParseQuery<ParseObject> query = ParseQuery.getQuery("GameScore");
    query.getInBackground(objectId, (object, e) -> {
        if (e == null) {
            object.put("score", 1338);
            object.saveInBackground(e1 -> {
                if (e1 == null) {
                    Log.d("UPDATE", "Updated object successfully");
                } else {
                    Log.e("UPDATE", "Error: " + e1.getMessage());
                }
            });
        } else {
            Log.e("UPDATE", "Error: " + e.getMessage());
        }
    });
}
~~~

#### Delete
~~~java
public void deleteObject(String objectId) {
    ParseQuery<ParseObject> query = ParseQuery.getQuery("GameScore");
    query.getInBackground(objectId, (object, e) -> {
        if (e == null) {
            object.deleteInBackground(e1 -> {
                if (e1 == null) {
                    Log.d("DELETE", "Deleted object successfully");
                } else {
                    Log.e("DELETE", "Error: " + e1.getMessage());
                }
            });
        } else {
            Log.e("DELETE", "Error: " + e.getMessage());
        }
    });
}
~~~
`,
    icon: 'android',
    name: 'Android Java/kotlin',
    iconColor: '#a4c639',
  },
  php: {
    content: `### Installation

Add to your \`composer.json\`:
~~~json
{
  "require": {
    "parse/php-sdk": "*"
  }
}
~~~
Then run:
~~~bash
composer install
~~~

### Initialization
~~~php
use Parse\ParseClient;

ParseClient::initialize('YOUR_APP_ID', 'YOUR_REST_KEY', 'YOUR_MASTER_KEY');
ParseClient::setServerURL('https://parseapi.back4app.com', '/');
~~~

### CRUD Operations

#### Create
~~~php
function createObject() {
    $gameScore = new ParseObject("GameScore");
    $gameScore->set("score", 1337);
    $gameScore->set("playerName", "Sean Plott");
    $gameScore->set("cheatMode", false);
    
    try {
        $gameScore->save();
        echo 'Created object with objectId: ' . $gameScore->getObjectId() . "\n";
    } catch (ParseException $ex) {
        echo 'Error: ' . $ex->getMessage() . "\n";
    }
}
~~~

#### Read
~~~php
function queryObjects() {
    $query = new ParseQuery("GameScore");
    $query->greaterThan("score", 1000);
    
    try {
        $results = $query->find();
        echo "Retrieved " . count($results) . " objects.\n";
        foreach ($results as $object) {
            echo $object->getObjectId() . " - " . $object->get("playerName") . "\n";
        }
    } catch (ParseException $ex) {
        echo 'Error: ' . $ex->getMessage() . "\n";
    }
}
~~~

#### Update
~~~php
function updateObject($objectId) {
    $query = new ParseQuery("GameScore");
    
    try {
        $gameScore = $query->get($objectId);
        $gameScore->set("score", 1338);
        $gameScore->save();
        echo "Updated object successfully\n";
    } catch (ParseException $ex) {
        echo 'Error: ' . $ex->getMessage() . "\n";
    }
}
~~~

#### Delete
~~~php
function deleteObject($objectId) {
    $query = new ParseQuery("GameScore");
    
    try {
        $gameScore = $query->get($objectId);
        $gameScore->destroy();
        echo "Deleted object successfully\n";
    } catch (ParseException $ex) {
        echo 'Error: ' . $ex->getMessage() . "\n";
    }
}
~~~`,
    icon: 'php',
    name: 'PHP',
    iconColor: '#4f5b93',
  },
};
const origin = new Position(0, 0);

const CodeBlock = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className={styles.codeBlockContainer}>
      <div className={styles.codeBlockHeader}>
        <div className={styles.languageLabel}>{language}</div>
        <div className={styles.copyButtonWrapper}>
          {copied && (
            <div className={styles.copyTooltip}>
              Copied!
            </div>
          )}
          <button className={styles.copyButton} onClick={copyToClipboard} title="Copy to clipboard">
            <Icon
              name={`${copied ? 'b4a-check-icon' : 'b4a-copy-icon'}`}
              fill={copied ? '#27AE60' : '#C1E2FF'}
              width={14}
              height={14}
            />
          </button>
        </div>
      </div>
      <SyntaxHighlighter language={language} style={oneDark} showLineNumbers={true}>
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

const ConnectAppModal = ({ closeModal }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(LanguageDocMap['rest']);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <Popover fadeIn={true} fixed={true} position={origin} modal={true} color="rgba(17,13,17,0.8)">
      <div className={styles.connectAppModal}>
        <div className={styles.connectAppModalHeader}>
          <div className={styles.connectAppModalTitle}>
            <div className={styles.dropdownContainer}>
              <div
                className={styles.dropdownTrigger}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className={styles.selectedLanguage}>
                  <Icon
                    name={selectedLanguage.icon}
                    fill={selectedLanguage.iconColor || ''}
                    width={20}
                    height={20}
                  />
                  <span>{selectedLanguage.name}</span>
                </div>
                <Icon name="b4a-chevron-down" width={16} height={16} fill="#f9f9f9" />
              </div>
              {isDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  {Object.entries(LanguageDocMap).map(([key, value]) => (
                    <div
                      key={key}
                      className={`${styles.dropdownItem} ${
                        selectedLanguage.name === value.name ? styles.selected : ''
                      }`}
                      onClick={() => {
                        setSelectedLanguage(value);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <Icon name={value.icon} fill={value.iconColor || ''} width={20} height={20} />
                      <span>{value.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className={styles.closeIcon} onClick={closeModal}>
            <Icon name="close" fill="#f9f9f9" width={14} height={14} />
          </div>
        </div>
        <div className={styles.connectAppModalContent} style={{ overflow: 'auto' }}>
          <ReactMarkdown
            renderers={{
              code: CodeBlock,
            }}
            children={selectedLanguage.content}
          />
        </div>
      </div>
    </Popover>
  );
};

export default ConnectAppModal;
