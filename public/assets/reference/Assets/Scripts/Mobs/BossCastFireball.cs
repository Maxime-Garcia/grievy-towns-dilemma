using System.Collections;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using UnityEngine;

public class BossCastFireBall : MonoBehaviour
{
    
	public float speed = 10f;
	public Vector3 direction;
	private GameObject player;
     



	private void Start()
	{
//        var pos = Camera.main.WorldToScreenPoint(transform.position);
		player = GameObject.Find("Player");
        
        
//		var angle = Mathf.Atan2(dir.y, dir.x) * Mathf.Rad2Deg;
//		transform.rotation = Quaternion.AngleAxis(angle, Vector3.forward);

//		Vector2 direction = dir;
//		direction.Normalize();
//		GameObject projectile = (GameObject)Instantiate(, pos, Quaternion.identity);
//		this.gameObject.GetComponent<Rigidbody2D>().velocity = direction * speed;
		transform.position = Vector2.MoveTowards( transform.position, player.transform.position, 3*Time.deltaTime);	
		Destroy(gameObject, 2.0f);

	}
    
	void OnCollisionEnter2D(Collision2D col)
	{
		if (col.gameObject.tag.Equals("Player"))
		{	
//			Physics2D.IgnoreCollision( col.gameObject.GetComponent<Collider2D>(), GetComponent<Collider2D>() );
			player.GetComponent<PlayerHealth>().TakeAHit(1);
			Destroy(gameObject);
			player.GetComponent<Rigidbody2D>().velocity = Vector2.zero;

   
		}
		//Destroy the projectile when it hit something
		if (!col.gameObject.tag.Equals("Player"))
		{	
			Destroy(gameObject);
		}
	}
    
	private void Update()
	{
		transform.position = Vector2.MoveTowards( transform.position, player.transform.position, 3*Time.deltaTime);	
	}
}

//
