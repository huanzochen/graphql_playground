const { ApolloServer, gql } = require("apollo-server");
const { DateTime, EmailAddress } = require("@okgrow/graphql-scalars");
const depthLimit = require("graphql-depth-limit");

let meId = 1;

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  scalar DateTime
	scalar EmailAddress

	"""
	高度單位
	"""
  enum HeightUnit {
    "公尺"
    METRE
    "公分"
    CENTIMETRE
		"英尺 (1 英尺 = 30.48 公分)"
		FOOT
  }

	"""
	重量單位
	"""
  enum WeightUnit {
    "公斤"
    KILOGRAM
    "公克"
    GRAM
		"磅 (1 磅 = 0.45359237 公斤)"
		POUND
  }
  
  """
	使用者
	"""
  type User {
		"識別碼"
		id: ID!
		"帳號"
		email: EmailAddress!
		"名字"
		name: String
		"年齡"
		age: Int
    "身高"
    height(unit: HeightUnit = CENTIMETRE): Float
    "體重"
    weight(unit: WeightUnit = KILOGRAM): Float @deprecated (reason: "It's secret")
		"朋友"
		friends: [User]
    "貼文"
		posts: [Post]
		"生日 ( ISO 格式)"
		birthDay: DateTime
  }
	
  """
  貼文
  """
	type Post {
		"識別碼"
		id: ID!
		"作者"
		author: User
		"標題"
		title: String
		"內容"
		content: String
		"建立時間"
		createdAt: DateTime
		"按讚者"
		likeGivers: [User]
	}

  type Query {
		"測試用 Hello World"
    hello: String
		"目前使用者"
		me: User
		"所有使用者"
		users: [User]
		"特定使用者"
		user(name: String!): User
  }
`;

// Provide resolver functions for your schema fields
const datas = generateDatas();

const findUserById = id => datas.users.find(user => user.id === id);
const findUserByName = name => datas.users.find(user => user.name === name);
const filterPostsByAuthorId = authorId =>
  datas.posts.filter(post => post.authorId === authorId);

// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    hello: (root, args, context) => {
      return "Hello world!";
    },
    me: (root, args, { userId }) => {
      return findUserById(userId);
    },
    users: () => datas.users,
    user: (root, { name }, context) => {
      return findUserByName(name);
    }
  },
  User: {
    friends: (parent, args, context) => {
      return parent.friendIds.map(id => findUserById(id));
    },
    posts: (parent, args, context) => {
      return filterPostsByAuthorId(parent.id);
    },
    height: (parent, args) => {
      const { unit } = args;
      if (!unit || unit === "CENTIMETRE") return parent.height;
      else if (unit === "METRE") return parent.height / 100;
      else if (unit === "FOOT") return parent.height / 30.48;
      throw new Error(`Height unit "${unit}" not supported.`);
    },
    weight: (parent, args, context) => {
      const { unit } = args;
      if (!unit || unit === "KILOGRAM") return parent.weight;
      else if (unit === "GRAM") return parent.weight * 100;
      else if (unit === "POUND") return parent.weight / 0.45359237;
      throw new Error(`Weight unit "${unit}" not supported.`);
    }
  },
  Post: {
    likeGivers: (parent, args, context) => {
      return parent.likeGiverIds.map(id => findUserById(id));
    },
    author: (parent, args, context) => {
      return findUserById(parent.authorId);
    }
  },
  DateTime,
  EmailAddress
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req, res }) => ({
    userId: meId
  }),
  validationRules: [depthLimit(5)]
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

// Optional: Export a root value to be passed during execution
// export const rootValue = {};

// Optional: Export a root function, that returns root to be passed
// during execution, accepting headers and secrets. It can return a
// promise. rootFunction takes precedence over rootValue.
// export function rootFunction(headers, secrets) {
//   return {
//     headers,
//     secrets,
//   };
// };
function generateDatas() {
  return {
    users: [
      {
        id: 1,
        name: "Fong",
        email: "fong@test.com",
        password: "123456",
        age: 25,
        friendIds: [2, 3],
        height: 175.0,
        weight: 70.0,
        birthDay: "1997-07-12"
      },
      {
        id: 2,
        name: "Kevin",
        email: "kevin@test.com",
        password: "kevin123456",
        age: 40,
        height: 185.0,
        weight: 90.0,
        friendIds: [1]
      },
      {
        id: 3,
        name: "Mary",
        email: "Mary@test.com",
        password: "mary123456",
        age: 18,
        height: 162,
        weight: null,
        friendIds: [1]
      }
    ],
    posts: [
      {
        id: 1,
        authorId: 1,
        title: "Hello World!!",
        content: "This is my first post. Nice to see you guys.",
        createdAt: "2018-10-15",
        likeGiverIds: [1, 3]
      },
      {
        id: 2,
        authorId: 2,
        title: "Good Night",
        content:
          "Started earnest brother believe an exposed so. Me he believing daughters if forfeited at furniture. Age again and stuff downs spoke. Late hour new nay able fat each sell. Nor themselves age introduced frequently use unsatiable devonshire get. They why quit gay cold rose deal park. One same they four did ask busy. Reserved opinions fat him nay position. Breakfast as zealously incommode do agreeable furniture. One too nay led fanny allow plate. ",
        createdAt: "2018-10-11",
        likeGiverIds: [2, 3]
      },
      {
        id: 3,
        authorId: 3,
        title: "Love U",
        content:
          "好濕。燕 草 如 碧 絲，秦 桑 低 綠 枝。當 君 懷 歸 日，是 妾 斷 腸 時 。春 風 不 相 識，	何 事 入 羅 幃 ？",
        createdAt: "2018-10-10",
        likeGiverIds: [1, 2]
      },
      {
        id: 4,
        authorId: 1,
        title: "Love U Too",
        content: "This is my first post. Nice to see you guys.",
        createdAt: "2018-10-10",
        likeGiverIds: [1, 2, 3]
      }
    ]
  };
}
