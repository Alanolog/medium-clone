import { GetStaticProps } from "next";
import React from "react";
import Header from "../../components/Header";
import { sanityClient, urlFor } from "../../sanity";
import { Post } from "../../typings";
import PortableText from "react-portable-text";
import { useForm, SubmitHandler } from "react-hook-form";

interface IFormInput {
  _id: string;
  name: string;
  email: string;
  comment: string;
}

interface Props {
  post: Post;
}

const onSubmit: SubmitHandler<IFormInput> = async (data) => {
  fetch("/api/createComment", {
    method: "POST",
    body: JSON.stringify(data),
  })
    .then(() => {
      console.log(data);
    })
    .catch((err) => console.log(err));
};

const Post = ({ post }: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IFormInput>();

  return (
    <main className="max-w-7xl mx-auto">
      <Header />
      <img
        className=" w-full h-40 object-cover"
        src={urlFor(post.mainImage).url()}
        alt=""
      />
      <article className="max-w-3xl mx-auto p-5">
        <h1 className=" text-3xl mt-10 mb-3">{post.title}</h1>
        <h2 className="text-xl font-light">{post.description}</h2>
        <div className=" flex items-center mt-2 gap-2">
          <img
            className="h-10 w-10 rounded-full object-cover"
            src={urlFor(post.author.image).url()}
            alt={post.author.name}
          />
          <p className="font-extralight text-sm">
            Blog post by:{" "}
            <span className="text-green-700 font-medium">
              {post.author.name}
            </span>{" "}
            - Published at {new Date(post._createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className=" mt-10">
          <PortableText
            content={post.body}
            dataset={process.env.NEXT_PUBLIC_SANITY_DATASET}
            projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}
            serializers={{
              h1: (props: any) => (
                <h1 className="text-2xl font-bold my-5">{...props}</h1>
              ),
              h2: (props: any) => (
                <h2 className="text-xl font-bold my-5">{...props}</h2>
              ),
              li: ({ children }: any) => (
                <li className="ml-4 list-disc">{children}</li>
              ),
              link: ({ href, children }: any) => (
                <a href={href} className="text-blue-500 hover:underline">
                  {children}
                </a>
              ),
            }}
          />
        </div>
      </article>
      <hr className=" max-w-lg my-5 mx-auto border border-yellow-500" />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col p-5 max-w-2xl mx-auto mb-10 "
      >
        <input {...register("_id")} type="hidden" name="_id" value={post._id} />
        <label className=" block mb-5 ">
          <span className=" text-gray-700">Name</span>
          <input
            type="text"
            {...register("name", { required: true })}
            placeholder="John Doe"
            className="shadow border rounded py-2 px-3 form-input mt-1 block w-full ring-yellow-500 focus:ring"
          />
        </label>{" "}
        <label className=" block mb-5 ">
          <span className=" text-gray-700">Email</span>
          <input
            {...register("email", { required: true })}
            type="email"
            placeholder="xyz@xyz.com"
            className="shadow border rounded py-2 px-3 form-input mt-1 block w-full ring-yellow-500 focus:ring"
          />
        </label>
        <label className=" block mb-5 ">
          <span className=" text-gray-700">Comment</span>
          <textarea
            {...register("comment", { required: true })}
            placeholder="John Doe"
            rows={8}
            className="shadow border rounded py-2 px-3 form-textarea  mt-1 block w-full ring-yellow-500 focus:ring"
          />
        </label>
        <div className="flex flex-col p-5">
          {errors?.name && (
            <span className="text-red-500">- The Name Field is required</span>
          )}{" "}
          {errors?.comment && (
            <span className="text-red-500">
              - The Comment Field is required
            </span>
          )}{" "}
          {errors?.email && (
            <span className="text-red-500">- The Email Field is required</span>
          )}
        </div>
        <input
          type="submit"
          className=" shadow bg-yellow-500 hover:bg-yellow-400  focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded cursor-pointer"
        />
      </form>
    </main>
  );
};

export default Post;

export const getStaticPaths = async () => {
  const query = `
    *[_type == "post"]{
        _id,
        slug {
          current
        }
      }
    `;
  const posts = await sanityClient.fetch(query);
  const paths = posts.map((post: Post) => ({
    params: {
      slug: post.slug.current,
    },
  }));

  return {
    paths,
    fallback: "blocking",
  };
};
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const query = `
    *[_type == "post" && slug.current == $slug][0]{
        _id,
        _createdAt,
        title,
        author->{
          name,
          image
        },
        'comments': *[
         _type == 'comment' &&
         post._ref == ^._id &&
         approved == true],
        description,
        mainImage,
        slug,
        body
      }
    `;

  const post = await sanityClient.fetch(query, { slug: params?.slug });

  return {
    props: {
      post,
    },
    revalidate: 300,
  };
};
